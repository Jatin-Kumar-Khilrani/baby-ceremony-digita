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

// API endpoint - use environment variable if set, otherwise fallback to dev/prod defaults
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:7071/api' : '/api')

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
  // Travel & Accommodation (for admin planning)
  arrivalDateTime?: string
  departureDateTime?: string
  transportNeeded?: boolean
  transportMode?: 'bus' | 'train' | 'flight' | '' // How they're traveling
  // Admin-only fields (not shown to guests)
  roomNumber?: string // Room 1-7
  transportDetails?: string
  adminNotes?: string
  allowDuplicateSubmission?: boolean // Admin privilege to bypass duplicate check
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
    message: '',
    arrivalDateTime: '',
    departureDateTime: '',
    transportNeeded: false,
    transportMode: '' as 'bus' | 'train' | 'flight' | ''
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
        `${API_BASE}/rsvps?action=search&email=${encodeURIComponent(foundRsvp.email)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        if (result.found) {
          // Refresh RSVP data to get the new PIN
          const refreshResponse = await fetch(`${API_BASE}/rsvps?_t=${Date.now()}`)
          if (refreshResponse.ok) {
            const allRsvps = await refreshResponse.json()
            const updated = allRsvps.find((rsvp: RSVP) => rsvp.id === foundRsvp.id)
            if (updated) {
              // Normalize dietary restrictions for legacy data
              const normalizedRsvp = {
                ...updated,
                dietaryRestrictions: (updated.dietaryRestrictions === 'Fasting' || updated.dietaryRestrictions === 'Vegetarian') 
                  ? updated.dietaryRestrictions 
                  : ''
              }
              setFoundRsvp(normalizedRsvp)
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
        toast.success(`Welcome ${user.name}! Your RSVP is loaded below for editing.`)
        // Automatically load the form for editing - skip verification since Google auth just succeeded
        handleEdit(foundRsvp, true)
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
      // Search for specific RSVP by email (more efficient - only fetches one RSVP)
      // Add timestamp to prevent caching
      const cacheBuster = `&_t=${Date.now()}`
      const response = await fetch(`${API_BASE}/rsvps?email=${encodeURIComponent(searchEmail)}${cacheBuster}`)
      
      if (response.ok) {
        const found = await response.json()
        
        // DEBUG: Log what we received from API
        console.log('=== SEARCH RESPONSE DEBUG ===');
        console.log('Email searched:', searchEmail);
        console.log('Response status:', response.status);
        console.log('Response data:', found);
        console.log('Is array?', Array.isArray(found));
        console.log('Data type:', typeof found);
        
        // CRITICAL: Check if API returned an array (all RSVPs) vs object (single RSVP)
        // Production API bug workaround: if array is returned, email wasn't found
        if (Array.isArray(found)) {
          console.log('❌ Array returned - checking if email exists in array');
          // Search within the array for the email
          const rsvpInArray = found.find((rsvp: any) => 
            rsvp.email && rsvp.email.toLowerCase() === searchEmail.toLowerCase()
          );
          
          if (rsvpInArray) {
            console.log('✅ Found RSVP in array:', rsvpInArray);
            // Normalize dietary restrictions for legacy data
            const normalizedRsvp = {
              ...rsvpInArray,
              dietaryRestrictions: (rsvpInArray.dietaryRestrictions === 'Fasting' || rsvpInArray.dietaryRestrictions === 'Vegetarian') 
                ? rsvpInArray.dietaryRestrictions 
                : ''
            }
            setFoundRsvp(normalizedRsvp)
            setGoogleUser(null)
            setIsPinVerified(false)
            setVerifyPin('')
            setShowPinOption(false)
            
            // Show different message if bypass is enabled
            if (normalizedRsvp.allowDuplicateSubmission) {
              toast.success('✅ RSVP found! Admin bypass enabled - you can edit directly without verification.')
            } else {
              toast.success('✅ RSVP found! Please verify using Google Sign-In or request a PIN.')
            }
            
            setIsSearching(false)
            return
          }
          
          console.log('❌ Email not found in array');
          // API returned all RSVPs, but email not in the list = NOT FOUND
          setFoundRsvp(null)
          setFormData(prev => ({ ...prev, email: searchEmail }))
          toast.message('No RSVP Found', {
            description: 'You can submit a new RSVP using the form below! 👇',
            duration: 5000,
          })
          setIsSearching(false)
          return
        }
        
        console.log('✅ Single object returned - RSVP found');
        // Normalize dietary restrictions for legacy data
        const normalizedRsvp = {
          ...found,
          dietaryRestrictions: (found.dietaryRestrictions === 'Fasting' || found.dietaryRestrictions === 'Vegetarian') 
            ? found.dietaryRestrictions 
            : ''
        }
        setFoundRsvp(normalizedRsvp)
        setGoogleUser(null)
        setIsPinVerified(false)
        setVerifyPin('')
        setShowPinOption(false) // Reset PIN option
        
        // Show different message if bypass is enabled
        if (normalizedRsvp.allowDuplicateSubmission) {
          toast.success('✅ RSVP found! Admin bypass enabled - you can edit directly without verification.')
        } else {
          toast.success('✅ RSVP found! Please verify using Google Sign-In or request a PIN.')
        }
      } else if (response.status === 404) {
        setFoundRsvp(null)
        // Pre-fill the email in the form for convenience
        setFormData(prev => ({ ...prev, email: searchEmail }))
        toast.message('No RSVP Found', {
          description: 'You can submit a new RSVP using the form below! 👇',
          duration: 5000,
        })
      } else {
        setFoundRsvp(null)
        toast.error('Failed to search for RSVP. Please try again.')
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
      toast.success('PIN verified! Your RSVP is loaded below for editing.')
      // Automatically load the form for editing
      handleEdit(foundRsvp)
    } else {
      toast.error('Incorrect PIN. Please try again.')
    }
  }

  const handleEdit = (rsvp: RSVP, skipVerification: boolean = false) => {
    // Check if user is verified (either via Google OAuth, PIN, or admin bypass enabled)
    const isGoogleVerified = googleUser && googleUser.email.toLowerCase() === rsvp.email.toLowerCase()
    const isPinAuth = isPinVerified && foundRsvp?.id === rsvp.id
    const isBypassEnabled = rsvp.allowDuplicateSubmission === true
    
    // Skip verification if: 1) Called from Google success handler, 2) Admin enabled bypass, 3) User is verified
    if (!skipVerification && !isGoogleVerified && !isPinAuth && !isBypassEnabled) {
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
      // Normalize dietary restrictions to match new dropdown options ('None', 'Fasting', 'Vegetarian')
      dietaryRestrictions: (rsvp.dietaryRestrictions === 'Fasting' || rsvp.dietaryRestrictions === 'Vegetarian') 
        ? rsvp.dietaryRestrictions 
        : 'None',
      message: rsvp.message,
      arrivalDateTime: rsvp.arrivalDateTime || '',
      departureDateTime: rsvp.departureDateTime || '',
      transportNeeded: rsvp.transportNeeded || false,
      transportMode: rsvp.transportMode || ''
    })
    setFoundRsvp(null)
    setSearchEmail('')
    setGoogleUser(null)
    setIsPinVerified(false)
  }

  const handleDelete = async (rsvp: RSVP) => {
    // Check if user is verified (either via Google OAuth, PIN, or admin bypass enabled)
    const isGoogleVerified = googleUser && googleUser.email.toLowerCase() === rsvp.email.toLowerCase()
    const isPinAuth = isPinVerified && foundRsvp?.id === rsvp.id
    const isBypassEnabled = rsvp.allowDuplicateSubmission === true
    
    if (!isGoogleVerified && !isPinAuth && !isBypassEnabled) {
      toast.error('Please verify your identity first (Google Sign-In or PIN)')
      return
    }
    
    if (!confirm('Are you sure you want to delete your RSVP?')) return
    
    // CRITICAL FIX: Ensure we have the complete RSVPs array before deleting
    if (!rsvps || !Array.isArray(rsvps) || rsvps.length === 0) {
      toast.error('Unable to delete RSVP. Please refresh the page and try again.')
      console.error('RSVPs array is invalid:', rsvps)
      return
    }

    // Verify the RSVP being deleted exists in the current array
    const existsInArray = rsvps.some(r => r.id === rsvp.id)
    if (!existsInArray) {
      toast.error('RSVP not found in current data. Please refresh and try again.')
      console.error('Deleting RSVP not found in array:', rsvp.id)
      return
    }
    
    // Save to backend
    try {
      const updatedRsvps = rsvps.filter(r => r.id !== rsvp.id)
      
      // Verify we're only removing one RSVP
      if (updatedRsvps.length !== rsvps.length - 1) {
        toast.error('Data integrity error. Please refresh and try again.')
        console.error('Array length mismatch during delete:', {
          original: rsvps.length,
          updated: updatedRsvps.length,
          expected: rsvps.length - 1
        })
        return
      }

      const response = await fetch(`${API_BASE}/rsvps?action=replace`, {
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
      message: '',
      arrivalDateTime: '',
      departureDateTime: '',
      transportNeeded: false,
      transportMode: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.attending) {
      toast.error('Please fill in all required fields')
      return
    }

    // Event date range validation - November 15th, 2025 is the main event
    const eventDate = new Date('2025-11-15')
    const eventDateStr = '15th November 2025'
    
    if (formData.attending === 'yes') {
      // Validate arrival date (should be on or before event date - comparing dates only)
      if (formData.arrivalDateTime) {
        const arrivalDate = new Date(formData.arrivalDateTime)
        const arrivalDateOnly = new Date(arrivalDate.getFullYear(), arrivalDate.getMonth(), arrivalDate.getDate())
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
        
        // Allow any time on November 15th or earlier
        if (arrivalDateOnly > eventDateOnly) {
          toast.error(`Arrival date cannot be after the event date (${eventDateStr})`)
          return
        }
      }
      
      // Validate departure date (should be on or after event date)
      if (formData.departureDateTime) {
        const departureDate = new Date(formData.departureDateTime)
        const eventDateStart = new Date('2025-11-15')
        eventDateStart.setHours(0, 0, 0, 0) // Set to start of day
        if (departureDate < eventDateStart) {
          toast.error(`Departure date cannot be before the event date (${eventDateStr})`)
          return
        }
      }
      
      // Validate arrival is before departure
      if (formData.arrivalDateTime && formData.departureDateTime) {
        const arrivalDate = new Date(formData.arrivalDateTime)
        const departureDate = new Date(formData.departureDateTime)
        if (arrivalDate >= departureDate) {
          toast.error('Arrival date must be before departure date')
          return
        }
      }
    }

    if (editingRsvp) {
      // Update existing RSVP
      // When editing, user has already verified their identity (Google/PIN/Bypass)
      // Allow them to update any fields including email/phone/name
      // This is their own RSVP, not a duplicate submission
      
      // For editing, we don't need the full array since we'll use the API endpoint
      const updatedRSVP: RSVP = {
        ...editingRsvp,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        attending: formData.attending === 'yes',
        guests: parseInt(formData.guests),
        dietaryRestrictions: formData.dietaryRestrictions,
        message: formData.message,
        arrivalDateTime: formData.arrivalDateTime || undefined,
        departureDateTime: formData.departureDateTime || undefined,
        transportNeeded: formData.transportNeeded,
        transportMode: formData.transportMode || undefined
      }

      // Save to backend
      try {
        let response;
        
        // If we have the full rsvps array (admin view), use replace action for consistency
        // Otherwise, use PUT for single RSVP update (user view - safer, won't delete other RSVPs)
        if (rsvps && Array.isArray(rsvps) && rsvps.length > 1) {
          // We have multiple RSVPs loaded - likely admin view
          // Safe to use replace action
          const updatedRsvpsArray = rsvps.map(r => r.id === editingRsvp.id ? updatedRSVP : r);
          
          response = await fetch(`${API_BASE}/rsvps?action=replace`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedRsvpsArray)
          });
        } else {
          // Only one RSVP loaded (user's own) - use PUT to update just this one
          // This is SAFER - won't accidentally delete other RSVPs
          response = await fetch(`${API_BASE}/rsvps`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedRSVP)
          });
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Update RSVP failed:', response.status, errorText);
          throw new Error(`Failed to update RSVP: ${response.status}`);
        }

        // Update local state
        setRSVPs(prev => {
          const prevArray = prev || [];
          const index = prevArray.findIndex(r => r.id === editingRsvp.id);
          if (index >= 0) {
            const newArray = [...prevArray];
            newArray[index] = updatedRSVP;
            return newArray;
          }
          return [...prevArray, updatedRSVP];
        });
        
        toast.success('✅ RSVP updated successfully!');
        setEditingRsvp(null);
        // Clear form
        setFormData({
          name: '',
          email: '',
          phone: '',
          attending: '',
          guests: '1',
          dietaryRestrictions: '',
          message: '',
          arrivalDateTime: '',
          departureDateTime: '',
          transportNeeded: false,
          transportMode: ''
        });
      } catch (error: any) {
        console.error('Error updating RSVP:', error);
        toast.error(`Failed to update RSVP: ${error.message || 'Please try again.'}`);
        return;
      }
    } else {
      // Check if already RSVP'd - check by email, phone, or family name
      const existing = rsvps?.find(rsvp => {
        // Check email match (case insensitive)
        if (rsvp.email && formData.email && 
            rsvp.email.toLowerCase() === formData.email.toLowerCase()) {
          return true
        }
        
        // Check phone match
        if (rsvp.phone && formData.phone && rsvp.phone === formData.phone) {
          return true
        }
        
        return false
      })
      
      // Check if existing RSVP has duplicate submission privilege
      // Block duplicate if: 1) existing RSVP found, AND 2) bypass is NOT explicitly enabled
      if (existing && existing.allowDuplicateSubmission !== true) {
        toast.error(
          `This family has already submitted an RSVP. Search for "${existing.name}" below to edit it.`,
          { duration: 6000 }
        )
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
        timestamp: Date.now(),
        arrivalDateTime: formData.arrivalDateTime || undefined,
        departureDateTime: formData.departureDateTime || undefined,
        transportNeeded: formData.transportNeeded,
        transportMode: formData.transportMode || undefined
      }

      // Save to backend
      try {
        const response = await fetch(`${API_BASE}/rsvps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRSVP)
        })

        if (!response.ok) {
          // Handle duplicate RSVP error from backend
          if (response.status === 409) {
            const errorData = await response.json();
            toast.error(
              errorData.message || 'This family has already submitted an RSVP. Search for it below to edit.',
              { duration: 6000 }
            );
            return;
          }
          throw new Error('Failed to save RSVP')
        }

        setRSVPs(prev => [...(prev || []), newRSVP])
        
        // Single consolidated success message
        const successMessage = formData.attending === 'yes' 
          ? '✅ RSVP submitted! We look forward to seeing you!' 
          : '✅ RSVP submitted! Thank you for letting us know.';
        
        const editInfo = '\n\nTo edit/delete later, search for your RSVP below and we\'ll send you a PIN.';
        
        toast.success(successMessage + editInfo, { 
          duration: 6000,
          style: { maxWidth: '500px' }
        })
        
        // Mark RSVP as completed for attention guide
        // Save submission info to localStorage (for this specific email only)
        localStorage.setItem('baby-ceremony-rsvp-completed', 'true')
        localStorage.setItem('baby-ceremony-last-rsvp-email', formData.email.toLowerCase())
        localStorage.setItem('baby-ceremony-last-rsvp-name', formData.name)
        
        // Auto-join WhatsApp group if attending (open after short delay)
        if (formData.attending === 'yes' && formData.phone) {
          setTimeout(() => {
            const whatsappGroupUrl = 'https://chat.whatsapp.com/BQfC4vHsXcK3E1yBd58l5H'
            window.open(whatsappGroupUrl, '_blank')
            // Show a subtle info toast after opening WhatsApp
            toast.info('Opening WhatsApp group "Welcome Parv"...', { 
              duration: 3000,
              style: { maxWidth: '400px' }
            })
          }, 2000)
        }
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
      message: '',
      arrivalDateTime: '',
      departureDateTime: '',
      transportNeeded: false,
      transportMode: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* RSVP Stats - Removed to keep attendance information private */}

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
              {/* Show bypass message if admin enabled bypass */}
              {foundRsvp.allowDuplicateSubmission && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Admin Bypass Enabled
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    You can edit or delete this RSVP without verification.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleEdit(foundRsvp, true)}
                      className="flex-1"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit RSVP
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(foundRsvp)}
                      className="flex-1"
                    >
                      <Trash className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Show verification options if bypass NOT enabled */}
              {!foundRsvp.allowDuplicateSubmission && !googleUser && !isPinVerified ? (
                <div className="space-y-4">
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
              <>
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
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-purple-900">
                        👨‍👩‍👧‍👦 RSVPing for multiple guests?
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        You can submit multiple RSVPs from the same device. Just use a <strong>different email or phone number</strong> for each guest.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-4">
              {/* Name and Email - Full width on mobile, side-by-side on desktop */}
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
              </div>
              
              {/* Phone and Guests - Full width on mobile, side-by-side on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="space-y-3">
              <Label>Will you be attending? *</Label>
              <RadioGroup 
                value={formData.attending} 
                onValueChange={(value) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    attending: value,
                    // Clear dietary preferences and travel info if not attending
                    dietaryRestrictions: value === 'no' ? '' : prev.dietaryRestrictions,
                    arrivalDateTime: value === 'no' ? '' : prev.arrivalDateTime,
                    departureDateTime: value === 'no' ? '' : prev.departureDateTime,
                    transportNeeded: value === 'no' ? false : prev.transportNeeded,
                    transportMode: value === 'no' ? '' : prev.transportMode
                  }))
                }}
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

            {/* Travel Information - Only show if attending */}
            {formData.attending === 'yes' && (
              <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 mt-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">Help Us Plan Your Stay</h4>
                    <p className="text-sm text-blue-800">
                      Share your travel details so we can arrange transportation and coordinate meals.
                    </p>
                  </div>
                </div>

                {/* Arrival and Departure Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="arrival">Arrival Date & Time</Label>
                    <Input
                      id="arrival"
                      type="datetime-local"
                      value={formData.arrivalDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, arrivalDateTime: e.target.value }))}
                      placeholder="When will you arrive?"
                      max="2025-11-15T23:59"
                      title="Arrival must be on or before the event date (15th November 2025)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be on or before 15th November 2025 (Event Date)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="departure">Departure Date & Time</Label>
                    <Input
                      id="departure"
                      type="datetime-local"
                      value={formData.departureDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, departureDateTime: e.target.value }))}
                      placeholder="When will you depart?"
                      min="2025-11-15T00:00"
                      title="Departure must be on or after the event date (15th November 2025)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be on or after 15th November 2025 (Event Date)
                    </p>
                  </div>
                </div>

                {/* Transportation */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="transport"
                      checked={formData.transportNeeded}
                      onChange={(e) => setFormData(prev => ({ ...prev, transportNeeded: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label="Transportation needed"
                    />
                    <Label htmlFor="transport" className="cursor-pointer text-sm">
                      I need transportation assistance from railway station/airport
                    </Label>
                  </div>

                  {/* Transport Mode - Show only if transport is needed */}
                  {formData.transportNeeded && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="transportMode">How are you traveling?</Label>
                      <Select 
                        value={formData.transportMode} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, transportMode: value as 'bus' | 'train' | 'flight' | '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select travel mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bus">🚌 Bus</SelectItem>
                          <SelectItem value="train">🚂 Train</SelectItem>
                          <SelectItem value="flight">✈️ Flight</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dietary Preference - Only show if attending */}
            {formData.attending === 'yes' && (
              <div className="space-y-2">
                <Label htmlFor="dietary">Dietary Preference (Hotel Options)</Label>
                <Select 
                  value={
                    // Normalize legacy values to match new options
                    formData.dietaryRestrictions === 'Fasting' || formData.dietaryRestrictions === 'Vegetarian' 
                      ? formData.dietaryRestrictions 
                      : 'None'
                  }
                  onValueChange={(value) => setFormData(prev => ({ ...prev, dietaryRestrictions: value === 'None' ? '' : value }))}
                >
                  <SelectTrigger id="dietary">
                    <SelectValue placeholder="Select dietary preference (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">No Preference</SelectItem>
                    <SelectItem value="Fasting">🙏 Fasting</SelectItem>
                    <SelectItem value="Vegetarian">🥗 Vegetarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Additional Notes (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Any dietary preferences, special requirements, or notes for the hosts..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                💝 Want to share wishes? Visit the <span className="font-semibold text-primary">Wishes tab</span> to leave your blessings with text or audio!
              </p>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-3">
              {editingRsvp ? 'Update RSVP' : 'Submit RSVP'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent RSVPs section removed for privacy */}
    </div>
  )
}