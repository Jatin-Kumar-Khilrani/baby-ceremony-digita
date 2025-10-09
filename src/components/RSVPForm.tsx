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
import { Users, Check, X, Heart } from '@phosphor-icons/react'

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.attending) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check if already RSVP'd
    const existing = rsvps?.find(rsvp => 
      rsvp.email.toLowerCase() === formData.email.toLowerCase() ||
      rsvp.phone === formData.phone
    )
    
    if (existing) {
      toast.error('You have already submitted an RSVP')
      return
    }

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

    setRSVPs(prev => [...(prev || []), newRSVP])
    
    toast.success(
      formData.attending === 'yes' 
        ? 'Thank you for your RSVP! We look forward to seeing you!' 
        : 'Thank you for letting us know. We\'ll miss you!'
    )
    
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

      {/* RSVP Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl font-script text-primary">
            Please RSVP by November 10th, 2025
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Help us prepare for this special celebration
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              Submit RSVP
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
              {rsvps.slice(-5).reverse().map((rsvp) => (
                <div key={rsvp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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