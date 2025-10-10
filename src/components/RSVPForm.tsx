import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Users, Check, X, Heart, Pencil, Trash, MagnifyingGlass } from '@phosphor-icons/react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

interface GoogleUser {
  email: string
  name: string
  picture: string
}

interface RSVP {
  id: string
  name: string
  email: string
  phone: string
  attending: boolean
  guests: number
  dietaryRestrictions: string
  message: string
  timestamp: number
  pin?: string // 4-digit PIN for authentication
  pinEmailSent?: boolean
  pinSentAt?: string
}

interface RSVPFormProps {
  rsvps: RSVP[]
  setRSVPs: (updater: (prev: RSVP[]) => RSVP[]) => void
}

export default function RSVPForm({ rsvps, setRSVPs }: RSVPFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    attending: '',
    guests: '1',
    dietaryRestrictions: '',
    message: ''
  })
  const [searchEmail, setSearchEmail] = useState('')
  const [verifyPin, setVerifyPin] = useState('')
  const [editingRsvp, setEditingRsvp] = useState<RSVP | null>(null)
  const [foundRsvp, setFoundRsvp] = useState<RSVP | null>(null)
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null)
  const [isPinVerified, setIsPinVerified] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showPinOption, setShowPinOption] = useState(false)
  const [isSendingPin, setIsSendingPin] = useState(false)

  // Handle requesting PIN via email
  const handleRequestPin = async () => {
    if (!foundRsvp) return
    
    setIsSendingPin(true)
    try {
      const response = await fetch(
        `http://localhost:7071/api/rsvps?action=search&email=${encodeURIComponent(foundRsvp.email)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        if (result.found) {
          // Refresh RSVP data to get the new PIN
          const refreshResponse = await fetch('http://localhost:7071/api/rsvps')
          if (refreshResponse.ok) {
            const allRsvps = await refreshResponse.json()
            const updated = allRsvps.find((rsvp: RSVP) => rsvp.id === foundRsvp.id)
            if (updated) {
              setFoundRsvp(updated)
              setRSVPs(() => allRsvps)
            }
          }
          setShowPinOption(true)
          toast.success('📧 PIN sent to your email! Please check your inbox.')
        }
      } else {
        toast.error('Failed to send PIN. Please try again.')
      }
    } catch (error) {
      console.error('Error requesting PIN:', error)
      toast.error('Error sending PIN. Please try again.')
    } finally {
      setIsSendingPin(false)
    }
  }

  // Handle Google Sign-In success
  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
      const decoded: any = jwtDecode(credentialResponse.credential)
      const user: GoogleUser = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      }
      setGoogleUser(user)
      
      // Check if the Google email matches the found RSVP email
      if (foundRsvp && user.email.toLowerCase() === foundRsvp.email.toLowerCase()) {
        toast.success(`Welcome ${user.name}! You can now edit or delete your RSVP.`)
      } else if (foundRsvp) {
        toast.error('This Google account email does not match the RSVP email.')
        setGoogleUser(null)
      }
    }
  }

  // Handle Google Sign-In failure
  const handleGoogleError = () => {
    toast.error('Google Sign-In failed. Please try again.')
  }

  const handleSearch = async () => {
    if (!searchEmail) {
      toast.error('Please enter an email address')
      return
    }

    setIsSearching(true)
    
    try {
      // Just search for the RSVP, don't send PIN yet
      const response = await fetch('http://localhost:7071/api/rsvps')
      
      if (!response.ok) {
        toast.error('Failed to search for RSVP. Please try again.')
        setIsSearching(false)
        return
      }
      
      const allRsvps = await response.json()
      const found = allRsvps.find((rsvp: RSVP) => 
        rsvp.email && searchEmail && rsvp.email.toLowerCase() === searchEmail.toLowerCase()
      )
      
      if (found) {
        setFoundRsvp(found)
        setRSVPs(() => allRsvps)
        setGoogleUser(null)
        setIsPinVerified(false)
        setVerifyPin('')
        setShowPinOption(false) // Reset PIN option
        
        toast.success('✅ RSVP found! Please verify using Google Sign-In or request a PIN.')
      } else {
        setFoundRsvp(null)
        toast.error('No RSVP found with this email')
      }
    } catch (error) {
      console.error('Error searching for RSVP:', error)
      toast.error('Error searching for RSVP. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePinVerify = () => {
    if (!foundRsvp || !foundRsvp.pin) {
      toast.error('No PIN found. Please search again.')
      return
    }
    
    if (verifyPin === foundRsvp.pin) {
      setIsPinVerified(true)
      toast.success('PIN verified! You can now edit or delete your RSVP.')
    } else {
      toast.error('Incorrect PIN. Please try again.')
    }
  }

  const handleEdit = (rsvp: RSVP) => {
    // Check if user is verified (either via Google OAuth or PIN)
    const isGoogleVerified = googleUser && googleUser.email.toLowerCase() === rsvp.email.toLowerCase()
    const isPinAuth = isPinVerified && foundRsvp?.id === rsvp.id
    
    if (!isGoogleVerified && !isPinAuth) {
      toast.error('Please verify your identity first (Google Sign-In or PIN)')
      return
    }
    
    setEditingRsvp(rsvp)
    setFormData({
      name: rsvp.name,
      email: rsvp.email,
      phone: rsvp.phone,
      attending: rsvp.attending ? 'yes' : 'no',
      guests: rsvp.guests.toString(),
      dietaryRestrictions: rsvp.dietaryRestrictions,
      message: rsvp.message
    })
    setFoundRsvp(null)
    setSearchEmail('')
    setGoogleUser(null)
    setIsPinVerified(false)
  }

  const handleDelete = async (rsvp: RSVP) => {
    // Check if user is verified (either via Google OAuth or PIN)
    const isGoogleVerified = googleUser && googleUser.email.toLowerCase() === rsvp.email.toLowerCase()
    const isPinAuth = isPinVerified && foundRsvp?.id === rsvp.id
    
    if (!isGoogleVerified && !isPinAuth) {
      toast.error('Please verify your identity first (Google Sign-In or PIN)')
      return
    }
    
    if (!confirm('Are you sure you want to delete your RSVP?')) return
    
    // Save to backend
    try {
      const updatedRsvps = (rsvps || []).filter(r => r.id !== rsvp.id)
      const response = await fetch('http://localhost:7071/api/rsvps?action=replace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRsvps)
      })

      if (!response.ok) {
        throw new Error('Failed to delete RSVP')
      }

      setRSVPs(prev => (prev || []).filter(r => r.id !== rsvp.id))
      toast.success('RSVP deleted successfully')
      setFoundRsvp(null)
      setSearchEmail('')
      setGoogleUser(null)
      setIsPinVerified(false)
    } catch (error) {
      console.error('Error deleting RSVP:', error)
      toast.error('Failed to delete RSVP. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setEditingRsvp(null)
    setFormData({
      name: '',
      email: '',
      phone: '',
      attending: '',
      guests: '1',
      dietaryRestrictions: '',
      message: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.attending) {
      toast.error('Please fill in all required fields')
      return
    }

    if (editingRsvp) {
      // Update existing RSVP
      const updatedRSVP: RSVP = {
        ...editingRsvp,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        attending: formData.attending === 'yes',
        guests: parseInt(formData.guests),
        dietaryRestrictions: formData.dietaryRestrictions,
        message: formData.message
      }

      // Save to backend
      try {
        const response = await fetch('http://localhost:7071/api/rsvps?action=replace', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rsvps?.map(r => r.id === editingRsvp.id ? updatedRSVP : r) || [])
        })

        if (!response.ok) {
          throw new Error('Failed to update RSVP')
        }

        setRSVPs(prev => (prev || []).map(r => r.id === editingRsvp.id ? updatedRSVP : r))
        toast.success('RSVP updated successfully!')
        setEditingRsvp(null)
      } catch (error) {
        console.error('Error updating RSVP:', error)
        toast.error('Failed to update RSVP. Please try again.')
        return
      }
    } else {
      // Check if already RSVP'd
      const existing = rsvps?.find(rsvp => 
        (rsvp.email && formData.email && rsvp.email.toLowerCase() === formData.email.toLowerCase()) ||
        (rsvp.phone && formData.phone && rsvp.phone === formData.phone)
      )
      
      if (existing) {
        toast.error('You have already submitted an RSVP. Search for it below to edit.')
        return
      }

      // Create new RSVP
      const newRSVP: RSVP = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        attending: formData.attending === 'yes',
        guests: parseInt(formData.guests),
        dietaryRestrictions: formData.dietaryRestrictions,
        message: formData.message,
        timestamp: Date.now()
      }

      // Save to backend
      try {
        const response = await fetch('http://localhost:7071/api/rsvps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRSVP)
        })

        if (!response.ok) {
          throw new Error('Failed to save RSVP')
        }

        setRSVPs(prev => [...(prev || []), newRSVP])
        
        toast.success(
          formData.attending === 'yes' 
            ? 'Thank you for your RSVP! We look forward to seeing you!' 
            : 'Thank you for letting us know. We\'ll miss you!',
          { duration: 5000 }
        )
        
        // PIN will be sent only when user searches to edit/delete
        toast.info(
          '✅ RSVP submitted! To edit/delete later, search for your RSVP below and we\'ll send you a PIN.',
          { duration: 8000 }
        )
      } catch (error) {
        console.error('Error saving RSVP:', error)
        toast.error('Failed to save RSVP. Please try again.')
        return
      }
    }
    
    setFormData({
      name: '',
      email: '',
      phone: '',
      attending: '',
      guests: '1',
      dietaryRestrictions: '',
      message: ''
    })
  }

  const attendingCount = rsvps?.filter(rsvp => rsvp.attending).length || 0
  const totalGuests = rsvps?.filter(rsvp => rsvp.attending).reduce((sum, rsvp) => sum + rsvp.guests, 0) || 0

  return (
    <div className="space-y-6">
      {/* RSVP Stats */}
      <Card className="bg-accent/10 border-accent/30">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center gap-6">
            <Badge variant="secondary" className="text-lg py-2 px-4">
              <Users size={18} className="mr-2" />
              {attendingCount} Families Attending
            </Badge>
            <Badge variant="outline" className="text-lg py-2 px-4">
              <Heart size={18} className="mr-2" />
              {totalGuests} Total Guests
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Search and Manage Your RSVP */}
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="text-center text-xl text-primary">
            Already Submitted? Manage Your RSVP
          </CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            Enter your email to edit or delete your RSVP
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              type="button" 
              variant="secondary"
              disabled={isSearching}
            >
              <MagnifyingGlass size={18} className="mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {foundRsvp && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{foundRsvp.name}</h3>
                  <p className="text-sm text-muted-foreground">{foundRsvp.email}</p>
                  <p className="text-sm mt-1">
                    {foundRsvp.attending ? '✓ Attending' : '✗ Not Attending'} • {foundRsvp.guests} guest{foundRsvp.guests > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {!googleUser && !isPinVerified ? (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">
                      🔐 Two ways to verify your identity:
                    </p>
                    
                    {/* Option 1: Google Sign-In */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong>Option 1 (Recommended):</strong> Sign in with Google
                      </p>
                      <div className="flex justify-center">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          useOneTap={false}
                        />
                      </div>
                    </div>

                    {/* OR Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">OR</span>
                      </div>
                    </div>

                    {/* Option 2: PIN */}
                    {!showPinOption ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Option 2 (Email PIN):</strong> Get a verification code via email
                        </p>
                        <Button 
                          onClick={handleRequestPin} 
                          variant="outline" 
                          className="w-full"
                          disabled={isSendingPin}
                        >
                          {isSendingPin ? 'Sending PIN...' : '📧 Send PIN to Email'}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Email PIN:</strong> Enter the 4-digit code sent to your email
                        </p>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Enter 4-digit PIN"
                            value={verifyPin}
                            onChange={(e) => setVerifyPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            onKeyDown={(e) => e.key === 'Enter' && handlePinVerify()}
                            maxLength={4}
                            className="text-center text-lg tracking-widest"
                          />
                          <Button onClick={handlePinVerify} size="sm">
                            Verify
                          </Button>
                        </div>
                        <button
                          onClick={handleRequestPin}
                          className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
                          disabled={isSendingPin}
                        >
                          Resend PIN
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                    <div className="flex items-center gap-2">
                      {googleUser?.picture && (
                        <img src={googleUser.picture} alt={googleUser.name} className="w-8 h-8 rounded-full" />
                      )}
                      <div>
                        <p className="text-sm text-green-800 font-semibold">
                          ✓ {googleUser ? `Signed in as ${googleUser.name}` : 'PIN Verified'}
                        </p>
                        {googleUser && (
                          <p className="text-xs text-green-700">{googleUser.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(foundRsvp)}
                      className="flex-1"
                    >
                      <Pencil size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(foundRsvp)}
                      className="flex-1"
                    >
                      <Trash size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RSVP Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-script text-primary">
            {editingRsvp ? 'Update Your RSVP' : 'Please RSVP by November 10th, 2025'}
          </CardTitle>
          <p className="text-center text-muted-foreground">
            {editingRsvp ? 'Make changes to your RSVP below' : 'Help us prepare for this special celebration'}
          </p>
          {editingRsvp && (
            <div className="text-center mt-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel Edit
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!editingRsvp && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      🔐 How to edit your RSVP later
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Search for your RSVP above, and we'll send you a PIN via email. You can also use Google Sign-In if you have a Google account.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guests">Number of Guests</Label>
                <Select 
                  value={formData.guests} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, guests: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of guests" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Will you be attending? *</Label>
              <RadioGroup 
                value={formData.attending} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, attending: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="flex items-center gap-2 cursor-pointer">
                    <Check size={16} className="text-green-600" />
                    Yes, I'll be there!
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="flex items-center gap-2 cursor-pointer">
                    <X size={16} className="text-red-500" />
                    Sorry, can't make it
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dietary">Dietary Restrictions</Label>
              <Input
                id="dietary"
                value={formData.dietaryRestrictions}
                onChange={(e) => setFormData(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                placeholder="Vegetarian, Vegan, Allergies, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Special Message or Wishes</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Share your blessings and wishes for baby Parv..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3">
              {editingRsvp ? 'Update RSVP' : 'Submit RSVP'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent RSVPs */}
      {rsvps && rsvps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent RSVPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rsvps.slice(-5).reverse().map((rsvp, index) => (
                <div key={rsvp.id || `rsvp-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{rsvp.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {rsvp.guests} guest{rsvp.guests > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge variant={rsvp.attending ? "default" : "secondary"}>
                    {rsvp.attending ? (
                      <>
                        <Check size={14} className="mr-1" />
                        Attending
                      </>
                    ) : (
                      <>
                        <X size={14} className="mr-1" />
                        Not Attending
                      </>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}