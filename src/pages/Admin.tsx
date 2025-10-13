import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AdminAuth } from '@/components/AdminAuth'
import { toast } from 'sonner'
import { 
  Users, 
  Heart, 
  Image as ImageIcon, 
  Download, 
  CheckCircle, 
  XCircle,
  Calendar,
  EnvelopeSimple,
  Phone as PhoneIcon,
  Pencil,
  Trash,
  Plus,
  SignOut,
  MapPin,
  Clock,
  Train,
  Bed,
  ForkKnife,
  WhatsappLogo,
  MagnifyingGlass,
  SortAscending
} from '@phosphor-icons/react'

const API_BASE = import.meta.env.DEV ? 'http://localhost:7071/api' : '/api'

// Helper function to calculate meals based on arrival/departure times
function calculateMeals(rsvps: RSVP[]) {
  const attendingWithTravel = rsvps.filter(r => r.attending && (r.arrivalDateTime || r.departureDateTime))
  
  let breakfast15 = 0
  let lunch15 = 0
  let dinner15 = 0
  let breakfast16 = 0
  let lunch16 = 0
  let dinner16 = 0
  
  attendingWithTravel.forEach(rsvp => {
    const guestCount = rsvp.guests || 1
    
    const arrival = rsvp.arrivalDateTime ? new Date(rsvp.arrivalDateTime) : null
    const departure = rsvp.departureDateTime ? new Date(rsvp.departureDateTime) : null
    
    // Define meal service times
    const breakfastEnd = 10 // 10 AM
    const lunchEnd = 14 // 2 PM
    const dinnerEnd = 22 // 10 PM
    
    // Nov 14th (day before event)
    if (arrival) {
      const arrivalDate = arrival.getDate()
      const arrivalHour = arrival.getHours()
      
      // If arriving on Nov 14
      if (arrivalDate === 14) {
        // Dinner on 14th: if arrival before 10 PM
        if (arrivalHour < dinnerEnd) {
          // dinner14 += guestCount (not counting 14th for now, but available)
        }
      }
    }
    
    // Nov 15th (main event day)
    // Count everyone staying overnight (arrival on 14th or 15th, departure on 15th evening or later)
    const staysFor15thBreakfast = arrival && arrival.getDate() <= 15
    const staysFor15thLunch = arrival && arrival.getDate() <= 15
    const staysFor15thDinner = arrival && arrival.getDate() <= 15
    
    if (staysFor15thBreakfast) {
      // If arrived on 14th or before 10 AM on 15th
      if (arrival.getDate() === 14 || 
          (arrival.getDate() === 15 && arrival.getHours() < breakfastEnd)) {
        breakfast15 += guestCount
      }
    }
    
    if (staysFor15thLunch) {
      // If arrived before 2 PM on 15th or earlier
      if (arrival.getDate() < 15 || 
          (arrival.getDate() === 15 && arrival.getHours() < lunchEnd)) {
        lunch15 += guestCount
      }
    }
    
    if (staysFor15thDinner) {
      // If arrived before 10 PM on 15th or earlier, and staying overnight (no departure on 15th)
      const departsBefore15Evening = departure && departure.getDate() === 15 && departure.getHours() < dinnerEnd
      if (!departsBefore15Evening && 
          (arrival.getDate() < 15 || (arrival.getDate() === 15 && arrival.getHours() < dinnerEnd))) {
        dinner15 += guestCount
      }
    }
    
    // Nov 16th (day after event)
    if (departure) {
      const departureDate = departure.getDate()
      const departureHour = departure.getHours()
      
      // Breakfast on 16th: if departing after 8 AM (or staying longer)
      if (departureDate > 16 || (departureDate === 16 && departureHour >= 8)) {
        breakfast16 += guestCount
      }
      
      // Lunch on 16th: if departing after 2 PM
      if (departureDate > 16 || (departureDate === 16 && departureHour >= lunchEnd)) {
        lunch16 += guestCount
      }
      
      // Dinner on 16th: if departing after 10 PM or staying longer
      if (departureDate > 16 || (departureDate === 16 && departureHour >= dinnerEnd)) {
        dinner16 += guestCount
      }
    } else if (arrival) {
      // No departure time provided - assume staying until Nov 16 morning (breakfast)
      // This means they'll need breakfast on Nov 16
      breakfast16 += guestCount
    }
  })
  
  return { breakfast15, lunch15, dinner15, breakfast16, lunch16, dinner16 }
}

// Helper function to format date/time
function formatDateTime(dateTimeStr: string | undefined) {
  if (!dateTimeStr) return 'Not provided'
  const date = new Date(dateTimeStr)
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
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
  // Travel & Accommodation fields
  arrivalDateTime?: string
  departureDateTime?: string
  transportNeeded?: boolean
  transportMode?: 'bus' | 'train' | 'flight' | ''
  // Admin-only fields
  roomNumber?: string
  transportDetails?: string
  adminNotes?: string
}

interface Wish {
  id: string
  name: string
  message: string
  timestamp: number
}

interface Photo {
  id: string
  url: string
  name: string
  caption?: string
  timestamp?: number
  uploadedAt?: string
}

// RSVP Edit Dialog Component
function RSVPEditDialog({ rsvp, onUpdate }: { rsvp: RSVP, onUpdate: (rsvp: RSVP) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(rsvp)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit RSVP</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="guests">Number of Guests *</Label>
              <Input
                id="guests"
                type="number"
                min="1"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="attending">Attendance Status *</Label>
            <Select
              value={formData.attending?.toString() || 'true'}
              onValueChange={(value) => setFormData({ ...formData, attending: value === 'true' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Attending</SelectItem>
                <SelectItem value="false">Not Attending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dietary">Dietary Restrictions</Label>
            <Input
              id="dietary"
              value={formData.dietaryRestrictions || ''}
              onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message || ''}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
            />
          </div>

          {/* Travel & Accommodation Section */}
          {formData.attending && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Travel & Accommodation</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="arrivalDateTime">Arrival Date & Time</Label>
                  <Input
                    id="arrivalDateTime"
                    type="datetime-local"
                    value={formData.arrivalDateTime || ''}
                    onChange={(e) => setFormData({ ...formData, arrivalDateTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="departureDateTime">Departure Date & Time</Label>
                  <Input
                    id="departureDateTime"
                    type="datetime-local"
                    value={formData.departureDateTime || ''}
                    onChange={(e) => setFormData({ ...formData, departureDateTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="transportNeeded"
                  checked={formData.transportNeeded || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, transportNeeded: checked as boolean })}
                />
                <Label htmlFor="transportNeeded" className="cursor-pointer">
                  Transportation assistance needed
                </Label>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-sm text-gray-700">Admin Only</h4>
                
                <div>
                  <Label htmlFor="roomNumber">Room Assignment</Label>
                  <Select
                    value={formData.roomNumber || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, roomNumber: value === 'none' ? '' : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No room assigned</SelectItem>
                      <SelectItem value="Room 1">Room 1</SelectItem>
                      <SelectItem value="Room 2">Room 2</SelectItem>
                      <SelectItem value="Room 3">Room 3</SelectItem>
                      <SelectItem value="Room 4">Room 4</SelectItem>
                      <SelectItem value="Room 5">Room 5</SelectItem>
                      <SelectItem value="Room 6">Room 6</SelectItem>
                      <SelectItem value="Room 7">Room 7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transportDetails">Transport Details</Label>
                  <Input
                    id="transportDetails"
                    placeholder="e.g., Train 12345, arrives 10:30 AM"
                    value={formData.transportDetails || ''}
                    onChange={(e) => setFormData({ ...formData, transportDetails: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <Textarea
                    id="adminNotes"
                    placeholder="Internal notes (not visible to guest)"
                    value={formData.adminNotes || ''}
                    onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Wish Edit Dialog Component
function WishEditDialog({ wish, onUpdate }: { wish: Wish, onUpdate: (wish: Wish) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState(wish)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Wish</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="wishName">Name *</Label>
            <Input
              id="wishName"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="wishMessage">Message *</Label>
            <Textarea
              id="wishMessage"
              value={formData.message || ''}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [wishes, setWishes] = useState<Wish[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRsvps, setSelectedRsvps] = useState<Set<string>>(new Set())
  const [selectedWishes, setSelectedWishes] = useState<Set<string>>(new Set())
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [rsvpSearchQuery, setRsvpSearchQuery] = useState('')
  const [rsvpSortBy, setRsvpSortBy] = useState<'name' | 'date' | 'guests' | 'status' | 'transport' | 'rooms' | 'meals'>('date')
  const [activeTab, setActiveTab] = useState<'rsvps' | 'wishes' | 'photos'>('rsvps')
  const rsvpSectionRef = useRef<HTMLDivElement>(null)
  const [stats, setStats] = useState({
    totalRsvps: 0,
    attending: 0,
    notAttending: 0,
    totalGuests: 0,
    totalWishes: 0,
    totalPhotos: 0,
    // Travel stats
    needingTransport: 0,
    roomsAllocated: 0,
    breakfast15: 0,
    lunch15: 0,
    dinner15: 0,
    breakfast16: 0,
    lunch16: 0,
    dinner16: 0,
    fasting: 0
  })

  // Check if already authenticated on mount
  useEffect(() => {
    const authData = sessionStorage.getItem('adminAuth')
    if (authData) {
      try {
        const parsed = JSON.parse(authData)
        // Check if authentication is less than 24 hours old
        const hoursSinceAuth = (Date.now() - parsed.timestamp) / (1000 * 60 * 60)
        if (parsed.authenticated && hoursSinceAuth < 24) {
          setIsAuthenticated(true)
        } else {
          sessionStorage.removeItem('adminAuth')
        }
      } catch (error) {
        console.error('Error parsing auth data:', error)
        sessionStorage.removeItem('adminAuth')
      }
    }
  }, [])

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData()
    }
  }, [isAuthenticated])

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth')
    setIsAuthenticated(false)
    toast.success('Logged out successfully')
  }

  const handleAuthenticated = () => {
    setIsAuthenticated(true)
  }

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [rsvpResponse, wishResponse, photoResponse] = await Promise.all([
        fetch(`${API_BASE}/rsvps`),
        fetch(`${API_BASE}/wishes`),
        fetch(`${API_BASE}/photos`)
      ])

      const rsvpData = await rsvpResponse.json()
      const wishData = await wishResponse.json()
      const photoData = await photoResponse.json()

      setRsvps(Array.isArray(rsvpData) ? rsvpData : [rsvpData].filter(Boolean))
      setWishes(Array.isArray(wishData) ? wishData : [wishData].filter(Boolean))
      setPhotos(Array.isArray(photoData) ? photoData : [photoData].filter(Boolean))

      // Calculate stats
      const rsvpArray = Array.isArray(rsvpData) ? rsvpData : [rsvpData].filter(Boolean)
      const attending = rsvpArray.filter((r: RSVP) => r.attending)
      const totalGuests = attending.reduce((sum: number, r: RSVP) => sum + (r.guests || 1), 0)
      
      // Travel stats
      const needingTransport = attending.filter((r: RSVP) => r.transportNeeded).length
      const roomsAllocated = attending.filter((r: RSVP) => r.roomNumber).length
      const meals = calculateMeals(rsvpArray)
      
      // Fasting count - guests with dietary restrictions mentioning fasting
      const fasting = attending.filter((r: RSVP) => 
        r.dietaryRestrictions && r.dietaryRestrictions.toLowerCase().includes('fasting')
      ).reduce((sum: number, r: RSVP) => sum + (r.guests || 1), 0)

      setStats({
        totalRsvps: rsvpArray.length,
        attending: attending.length,
        notAttending: rsvpArray.filter((r: RSVP) => !r.attending).length,
        totalGuests,
        totalWishes: Array.isArray(wishData) ? wishData.length : (wishData ? 1 : 0),
        totalPhotos: Array.isArray(photoData) ? photoData.length : (photoData ? 1 : 0),
        needingTransport,
        roomsAllocated,
        fasting,
        ...meals
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // If not authenticated, show authentication screen
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(item => 
      Object.values(item).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    )
    
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Helper function to format phone number for WhatsApp
  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/[^0-9]/g, '')
    
    // If number starts with 0 (Indian format), remove it and add country code 91
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1)
    }
    // If number doesn't start with country code, assume India and add 91
    else if (cleaned.length === 10) {
      cleaned = '91' + cleaned
    }
    
    return cleaned
  }

  // CRUD Operations for RSVPs
  const deleteRSVP = async (id: string) => {
    if (!confirm('Are you sure you want to delete this RSVP?')) return
    
    try {
      const updatedRsvps = rsvps.filter(r => r.id !== id)
      
      const response = await fetch(`${API_BASE}/rsvps?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRsvps)
      })

      if (response.ok) {
        toast.success('RSVP deleted successfully')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to delete RSVP')
      console.error(error)
    }
  }

  const updateRSVP = async (updatedRsvp: RSVP) => {
    try {
      const updatedRsvps = rsvps.map(r => r.id === updatedRsvp.id ? updatedRsvp : r)
      
      const response = await fetch(`${API_BASE}/rsvps?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRsvps)
      })

      if (response.ok) {
        toast.success('RSVP updated successfully')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to update RSVP')
      console.error(error)
    }
  }

  // Bulk delete RSVPs
  const bulkDeleteRsvps = async () => {
    if (selectedRsvps.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedRsvps.size} RSVP(s)?`)) return
    
    try {
      const updatedRsvps = rsvps.filter(r => !selectedRsvps.has(r.id))
      
      const response = await fetch(`${API_BASE}/rsvps?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRsvps)
      })

      if (response.ok) {
        toast.success(`${selectedRsvps.size} RSVP(s) deleted successfully`)
        setSelectedRsvps(new Set())
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to delete RSVPs')
      console.error(error)
    }
  }

  // Toggle RSVP selection
  const toggleRsvpSelection = (id: string) => {
    const newSelection = new Set(selectedRsvps)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedRsvps(newSelection)
  }

  // Select all RSVPs
  const toggleAllRsvps = () => {
    if (selectedRsvps.size === rsvps.length) {
      setSelectedRsvps(new Set())
    } else {
      setSelectedRsvps(new Set(rsvps.map(r => r.id)))
    }
  }

  // CRUD Operations for Wishes
  const deleteWish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this wish?')) return
    
    try {
      const updatedWishes = wishes.filter(w => w.id !== id)
      
      const response = await fetch(`${API_BASE}/wishes?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWishes)
      })

      if (response.ok) {
        toast.success('Wish deleted successfully')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to delete wish')
      console.error(error)
    }
  }

  const updateWish = async (updatedWish: Wish) => {
    try {
      const updatedWishes = wishes.map(w => w.id === updatedWish.id ? updatedWish : w)
      
      const response = await fetch(`${API_BASE}/wishes?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWishes)
      })

      if (response.ok) {
        toast.success('Wish updated successfully')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to update wish')
      console.error(error)
    }
  }

  // Bulk delete Wishes
  const bulkDeleteWishes = async () => {
    if (selectedWishes.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedWishes.size} wish(es)?`)) return
    
    try {
      const updatedWishes = wishes.filter(w => !selectedWishes.has(w.id))
      
      const response = await fetch(`${API_BASE}/wishes?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWishes)
      })

      if (response.ok) {
        toast.success(`${selectedWishes.size} wish(es) deleted successfully`)
        setSelectedWishes(new Set())
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to delete wishes')
      console.error(error)
    }
  }

  // Toggle Wish selection
  const toggleWishSelection = (id: string) => {
    const newSelection = new Set(selectedWishes)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedWishes(newSelection)
  }

  // Select all Wishes
  const toggleAllWishes = () => {
    if (selectedWishes.size === wishes.length) {
      setSelectedWishes(new Set())
    } else {
      setSelectedWishes(new Set(wishes.map(w => w.id)))
    }
  }

  // CRUD Operations for Photos
  const deletePhoto = async (id: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    
    try {
      const updatedPhotos = photos.filter(p => p.id !== id)
      
      const response = await fetch(`${API_BASE}/photos?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPhotos)
      })

      if (response.ok) {
        toast.success('Photo deleted successfully')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to delete photo')
      console.error(error)
    }
  }

  // Bulk delete Photos
  const bulkDeletePhotos = async () => {
    if (selectedPhotos.size === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedPhotos.size} photo(s)?`)) return
    
    try {
      const updatedPhotos = photos.filter(p => !selectedPhotos.has(p.id))
      
      const response = await fetch(`${API_BASE}/photos?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPhotos)
      })

      if (response.ok) {
        toast.success(`${selectedPhotos.size} photo(s) deleted successfully`)
        setSelectedPhotos(new Set())
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to delete photos')
      console.error(error)
    }
  }

  // Toggle Photo selection
  const togglePhotoSelection = (id: string) => {
    const newSelection = new Set(selectedPhotos)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedPhotos(newSelection)
  }

  // Select all Photos
  const toggleAllPhotos = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set())
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)))
    }
  }

  // Filter and sort RSVPs
  const getFilteredAndSortedRsvps = () => {
    let filtered = [...rsvps]
    
    // Apply search filter
    if (rsvpSearchQuery.trim()) {
      const query = rsvpSearchQuery.toLowerCase()
      filtered = filtered.filter(rsvp => 
        rsvp.name.toLowerCase().includes(query) ||
        rsvp.email.toLowerCase().includes(query) ||
        rsvp.phone.includes(query) ||
        (rsvp.roomNumber && rsvp.roomNumber.toLowerCase().includes(query))
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (rsvpSortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return b.timestamp - a.timestamp // Most recent first
        case 'guests':
          return (b.guests || 1) - (a.guests || 1) // Most guests first
        case 'status':
          if (a.attending === b.attending) return 0
          return a.attending ? -1 : 1 // Attending first
        case 'transport':
          // Sort by transport needed, then by transport mode
          if (a.transportNeeded === b.transportNeeded) {
            // If both need transport, sort by mode
            if (a.transportNeeded && a.transportMode && b.transportMode) {
              return a.transportMode.localeCompare(b.transportMode)
            }
            return 0
          }
          return a.transportNeeded ? -1 : 1 // Transport needed first
        case 'rooms':
          // Sort by room allocated (those with rooms first)
          if ((a.roomNumber ? 1 : 0) === (b.roomNumber ? 1 : 0)) {
            // If both have or don't have rooms, sort by room number
            if (a.roomNumber && b.roomNumber) {
              return a.roomNumber.localeCompare(b.roomNumber)
            }
            return 0
          }
          return a.roomNumber ? -1 : 1 // With rooms first
        case 'meals':
          // Sort by meals needed (arrival/departure times indicating meal requirements)
          const aHasMeals = (a.arrivalDateTime || a.departureDateTime) ? 1 : 0
          const bHasMeals = (b.arrivalDateTime || b.departureDateTime) ? 1 : 0
          if (aHasMeals === bHasMeals) {
            // Secondary sort by arrival time if both have meals
            if (a.arrivalDateTime && b.arrivalDateTime) {
              return new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime()
            }
            return 0
          }
          return bHasMeals - aHasMeals // With meals first
        default:
          return 0
      }
    })
    
    return filtered
  }

  const filteredRsvps = getFilteredAndSortedRsvps()

  // Handler for clicking transport stat - scroll to RSVPs and filter
  const handleTransportClick = () => {
    setActiveTab('rsvps')
    setRsvpSortBy('transport')
    // Scroll to RSVP section
    setTimeout(() => {
      rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Handler for clicking attending stat - scroll to RSVPs and filter
  const handleAttendingClick = () => {
    setActiveTab('rsvps')
    setRsvpSortBy('status')
    setTimeout(() => {
      rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Handler for clicking guests stat - scroll to RSVPs and filter
  const handleGuestsClick = () => {
    setActiveTab('rsvps')
    setRsvpSortBy('guests')
    setTimeout(() => {
      rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Handler for clicking total RSVPs stat - scroll to RSVPs
  const handleTotalRsvpsClick = () => {
    console.log('Total RSVPs clicked, switching to rsvps tab')
    setActiveTab('rsvps')
    setRsvpSortBy('date')
    setTimeout(() => {
      rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Handler for clicking wishes stat - switch to wishes tab
  const handleWishesClick = () => {
    setActiveTab('wishes')
    setTimeout(() => {
      rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Handler for clicking photos stat - switch to photos tab
  const handlePhotosClick = () => {
    setActiveTab('photos')
    setTimeout(() => {
      rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Handler for clicking rooms stat - scroll to RSVPs and filter by rooms
  const handleRoomsClick = () => {
    setActiveTab('rsvps')
    setRsvpSortBy('rooms')
    setTimeout(() => {
      rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Handler for clicking meals stat - scroll to RSVPs and filter by meals
  const handleMealsClick = () => {
    setActiveTab('rsvps')
    setRsvpSortBy('meals')
    setTimeout(() => {
      rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-gray-600 mb-4">Manage your baby ceremony invitations</p>
          <div className="flex items-center justify-center gap-3">
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
            >
              Back to Main Page
            </Button>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <SignOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card 
            key="stat-total-rsvps"
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleTotalRsvpsClick}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-600 shrink-0" />
                <div className="text-2xl font-bold break-words">{stats.totalRsvps}</div>
                <div className="text-sm text-gray-600 break-words">Total RSVPs</div>
              </div>
            </CardContent>
          </Card>

          <Card 
            key="stat-attending"
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleAttendingClick}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600 shrink-0" />
                <div className="text-2xl font-bold break-words">{stats.attending}</div>
                <div className="text-sm text-gray-600 break-words">Attending</div>
              </div>
            </CardContent>
          </Card>

          <Card 
            key="stat-not-attending"
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleAttendingClick}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600 shrink-0" />
                <div className="text-2xl font-bold break-words">{stats.notAttending}</div>
                <div className="text-sm text-gray-600 break-words">Not Attending</div>
              </div>
            </CardContent>
          </Card>

          <Card 
            key="stat-total-guests"
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleGuestsClick}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600 shrink-0" />
                <div className="text-2xl font-bold break-words">{stats.totalGuests}</div>
                <div className="text-sm text-gray-600 break-words">Total Guests</div>
              </div>
            </CardContent>
          </Card>

          <Card 
            key="stat-wishes"
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleWishesClick}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600 shrink-0" />
                <div className="text-2xl font-bold break-words">{stats.totalWishes}</div>
                <div className="text-sm text-gray-600 break-words">Wishes</div>
              </div>
            </CardContent>
          </Card>

          <Card 
            key="stat-photos"
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handlePhotosClick}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-indigo-600 shrink-0" />
                <div className="text-2xl font-bold break-words">{stats.totalPhotos}</div>
                <div className="text-sm text-gray-600 break-words">Photos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Travel & Accommodation Stats */}
        {stats.attending > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Travel & Accommodation Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={handleRoomsClick}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Bed className="w-8 h-8 mx-auto mb-2 text-orange-600 shrink-0" />
                    <div className="text-2xl font-bold break-words">{stats.roomsAllocated} / 7</div>
                    <div className="text-sm text-gray-600 break-words">Rooms Allocated</div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={handleTransportClick}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Train className="w-8 h-8 mx-auto mb-2 text-cyan-600 shrink-0" />
                    <div className="text-2xl font-bold break-words">{stats.needingTransport}</div>
                    <div className="text-sm text-gray-600 break-words">Need Transport</div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={handleMealsClick}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <ForkKnife className="w-8 h-8 mx-auto mb-2 text-teal-600 shrink-0" />
                    <div className="text-2xl font-bold break-words">{stats.breakfast15 + stats.lunch15 + stats.dinner15}</div>
                    <div className="text-sm text-gray-600 break-words">Meals on Nov 15</div>
                    <div className="text-xs text-gray-500 break-words mt-1">Total count</div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={handleMealsClick}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <ForkKnife className="w-8 h-8 mx-auto mb-2 text-amber-600 shrink-0" />
                    <div className="text-2xl font-bold break-words">{stats.breakfast16}</div>
                    <div className="text-sm text-gray-600 break-words">Breakfast Nov 16</div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setActiveTab('rsvps')
                  setRsvpSortBy('date')
                  setTimeout(() => {
                    rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 100)
                }}
              >
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Heart className="w-8 h-8 mx-auto mb-2 text-purple-600 shrink-0" />
                    <div className="text-2xl font-bold break-words">{stats.fasting}</div>
                    <div className="text-sm text-gray-600 break-words">Fasting Guests</div>
                    <div className="text-xs text-gray-500 break-words mt-1">Total count</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Meal Planning Breakdown */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ForkKnife className="w-5 h-5" />
                  Meal Planning (Auto-calculated from arrival/departure times)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* November 15th Meals */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">November 15th (Main Event Day)</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-amber-50 rounded-lg overflow-hidden">
                        <div className="text-2xl font-bold text-amber-700 break-words">{stats.breakfast15}</div>
                        <div className="text-sm text-gray-600 mt-1 break-words">Breakfast</div>
                        <div className="text-xs text-gray-500 break-words">Arrivals &lt; 10 AM</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg overflow-hidden">
                        <div className="text-2xl font-bold text-orange-700 break-words">{stats.lunch15}</div>
                        <div className="text-sm text-gray-600 mt-1 break-words">Lunch</div>
                        <div className="text-xs text-gray-500 break-words">Arrivals &lt; 2 PM</div>
                      </div>
                      <div className="text-center p-3 bg-rose-50 rounded-lg overflow-hidden">
                        <div className="text-2xl font-bold text-rose-700 break-words">{stats.dinner15}</div>
                        <div className="text-sm text-gray-600 mt-1 break-words">Dinner</div>
                        <div className="text-xs text-gray-500 break-words">Arrivals &lt; 10 PM</div>
                      </div>
                    </div>
                  </div>

                  {/* November 16th Meals */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">November 16th (Next Day)</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-yellow-50 rounded-lg overflow-hidden">
                        <div className="text-2xl font-bold text-yellow-700 break-words">{stats.breakfast16}</div>
                        <div className="text-sm text-gray-600 mt-1 break-words">Breakfast</div>
                        <div className="text-xs text-gray-500 break-words">Departures ≥ 8 AM</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg overflow-hidden">
                        <div className="text-2xl font-bold text-orange-700 break-words">{stats.lunch16 || 0}</div>
                        <div className="text-sm text-gray-600 mt-1 break-words">Lunch</div>
                        <div className="text-xs text-gray-500 break-words">Departures ≥ 2 PM</div>
                      </div>
                      <div className="text-center p-3 bg-rose-50 rounded-lg overflow-hidden">
                        <div className="text-2xl font-bold text-rose-700 break-words">{stats.dinner16 || 0}</div>
                        <div className="text-sm text-gray-600 mt-1 break-words">Dinner</div>
                        <div className="text-xs text-gray-500 break-words">Departures ≥ 10 PM</div>
                      </div>
                    </div>
                  </div>

                  {/* Example Scenario */}
                  <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
                    <strong>Example:</strong> Guest arriving Nov 14 at 10:00 PM and departing Nov 16 at 8:00 AM will be counted for:
                    <ul className="ml-4 mt-1 list-disc">
                      <li>Nov 15: Breakfast ✅, Lunch ✅, Dinner ✅</li>
                      <li>Nov 16: Breakfast ✅</li>
                    </ul>
                    <div className="mt-2">
                      <strong>Note:</strong> If no departure time is provided, guest is assumed to stay until Nov 16 morning (breakfast included).
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div ref={rsvpSectionRef}>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              console.log('Tab changed to:', value)
              setActiveTab(value as 'rsvps' | 'wishes' | 'photos')
            }} 
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
              <TabsTrigger value="wishes">Wishes</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
            </TabsList>

            {/* RSVPs Tab */}
            <TabsContent value="rsvps">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle>RSVPs ({stats.totalRsvps})</CardTitle>
                    {selectedRsvps.size > 0 && (
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={bulkDeleteRsvps}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Selected ({selectedRsvps.size})
                      </Button>
                    )}
                  </div>
                  <Button 
                    onClick={() => exportToCSV(rsvps, 'rsvps')}
                    size="sm"
                    disabled={rsvps.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rsvps.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No RSVPs yet</p>
                ) : (
                  <>
                    {/* Search and Sort Controls */}
                    <div className="mb-4 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search by name, email, phone, or room..."
                            value={rsvpSearchQuery}
                            onChange={(e) => setRsvpSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        {/* Sort Dropdown */}
                        <div className="w-full sm:w-48">
                          <Select value={rsvpSortBy} onValueChange={(value: any) => setRsvpSortBy(value)}>
                            <SelectTrigger>
                              <div className="flex items-center gap-2">
                                <SortAscending className="w-4 h-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="date">Sort by Date</SelectItem>
                              <SelectItem value="name">Sort by Name</SelectItem>
                              <SelectItem value="guests">Sort by Guests</SelectItem>
                              <SelectItem value="status">Sort by Status</SelectItem>
                              <SelectItem value="transport">Sort by Transport</SelectItem>
                              <SelectItem value="rooms">Sort by Rooms</SelectItem>
                              <SelectItem value="meals">Sort by Meals</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Results count */}
                      {rsvpSearchQuery.trim() && (
                        <p className="text-sm text-gray-600">
                          Found {filteredRsvps.length} of {rsvps.length} RSVPs
                        </p>
                      )}
                    </div>
                    
                    {/* Select All Checkbox */}
                    <div className="mb-4 flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <Checkbox 
                        id="select-all-rsvps"
                        checked={selectedRsvps.size === rsvps.length && rsvps.length > 0}
                        onCheckedChange={toggleAllRsvps}
                      />
                      <label htmlFor="select-all-rsvps" className="text-sm font-medium cursor-pointer">
                        Select All ({rsvps.length})
                      </label>
                    </div>
                    
                    <div className="space-y-4">
                      {filteredRsvps.map((rsvp, index) => (
                        <div key={rsvp.id || `rsvp-${index}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={selectedRsvps.has(rsvp.id)}
                              onCheckedChange={() => toggleRsvpSelection(rsvp.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">{rsvp.name}</h3>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {rsvp.attending ? (
                                      <Badge className="bg-green-100 text-green-800 text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Attending
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800 text-xs">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Not Attending
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      <Users className="w-3 h-3 mr-1" />
                                      {rsvp.guests} {rsvp.guests === 1 ? 'guest' : 'guests'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                                  <span className="text-xs text-gray-500 whitespace-nowrap">
                                    <Calendar className="w-3 h-3 inline mr-1" />
                                    {formatDate(rsvp.timestamp)}
                                  </span>
                                  <div className="flex gap-2">
                                    <RSVPEditDialog rsvp={rsvp} onUpdate={updateRSVP} />
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => deleteRSVP(rsvp.id)}
                                      className="h-8"
                                    >
                                      <Trash className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 text-sm">
                                <div className="break-words">
                                  <EnvelopeSimple className="w-4 h-4 inline mr-1 text-gray-400" />
                                  <a href={`mailto:${rsvp.email}`} className="text-blue-600 hover:underline break-all">
                                    {rsvp.email}
                                  </a>
                                </div>
                                <div className="break-words flex items-center gap-2 flex-wrap">
                                  <div>
                                    <PhoneIcon className="w-4 h-4 inline mr-1 text-gray-400" />
                                    <a href={`tel:${rsvp.phone}`} className="text-blue-600 hover:underline">
                                      {rsvp.phone}
                                    </a>
                                  </div>
                                  <a
                                    href={`https://wa.me/${formatPhoneForWhatsApp(rsvp.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs"
                                    title="Chat on WhatsApp"
                                  >
                                    <WhatsappLogo className="w-3 h-3" weight="fill" />
                                    WhatsApp
                                  </a>
                                </div>
                              </div>

                              {rsvp.dietaryRestrictions && (
                                <div className="mt-2 text-sm">
                                  <strong>Dietary Restrictions:</strong> {rsvp.dietaryRestrictions}
                                </div>
                              )}

                              {/* Travel & Accommodation Info */}
                              {rsvp.attending && (rsvp.arrivalDateTime || rsvp.departureDateTime || rsvp.transportNeeded || rsvp.roomNumber) && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md overflow-hidden">
                                  <div className="flex items-center gap-2 mb-3">
                                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                                    <strong className="text-sm text-blue-900">Travel & Accommodation</strong>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {rsvp.arrivalDateTime && (
                                      <div className="flex items-start gap-2 text-xs">
                                        <Clock className="w-3 h-3 mt-0.5 text-gray-500 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <span className="text-gray-600 block">Arrival:</span>
                                          <div className="font-medium text-gray-900 break-words">{formatDateTime(rsvp.arrivalDateTime)}</div>
                                        </div>
                                      </div>
                                    )}
                                    {rsvp.departureDateTime && (
                                      <div className="flex items-start gap-2 text-xs">
                                        <Clock className="w-3 h-3 mt-0.5 text-gray-500 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                          <span className="text-gray-600 block">Departure:</span>
                                          <div className="font-medium text-gray-900 break-words">{formatDateTime(rsvp.departureDateTime)}</div>
                                        </div>
                                      </div>
                                    )}
                                    {rsvp.transportNeeded && (
                                      <div className="pt-1">
                                        <Badge className="bg-cyan-100 text-cyan-800 text-xs">
                                          <Train className="w-3 h-3 mr-1" />
                                          Needs Transportation
                                          {rsvp.transportMode && (
                                            <span className="ml-1">
                                              {rsvp.transportMode === 'bus' && '🚌'}
                                              {rsvp.transportMode === 'train' && '🚂'}
                                              {rsvp.transportMode === 'flight' && '✈️'}
                                              {' '}
                                              {rsvp.transportMode.charAt(0).toUpperCase() + rsvp.transportMode.slice(1)}
                                            </span>
                                          )}
                                        </Badge>
                                      </div>
                                    )}
                                    {rsvp.roomNumber && (
                                      <div className="pt-1">
                                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                                          <Bed className="w-3 h-3 mr-1" />
                                          {rsvp.roomNumber}
                                        </Badge>
                                      </div>
                                    )}
                                    {rsvp.transportDetails && (
                                      <div className="pt-1">
                                        <span className="text-xs text-gray-600 block">Transport Details:</span>
                                        <div className="text-xs font-medium text-gray-900 break-words">{rsvp.transportDetails}</div>
                                      </div>
                                    )}
                                    {rsvp.adminNotes && (
                                      <div className="pt-2 border-t border-blue-200">
                                        <span className="text-xs text-gray-600 block">Admin Notes:</span>
                                        <div className="text-xs text-gray-700 italic break-words">{rsvp.adminNotes}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {rsvp.message && (
                                <div className="mt-2 p-3 bg-purple-50 rounded-md">
                                  <strong className="text-sm text-purple-900">Message:</strong>
                                  <p className="text-gray-700 mt-1 italic">"{rsvp.message}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishes Tab */}
          <TabsContent value="wishes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Guest Wishes ({stats.totalWishes})</CardTitle>
                  <div className="flex gap-2">
                    {selectedWishes.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={bulkDeleteWishes}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete Selected ({selectedWishes.size})
                      </Button>
                    )}
                    <Button 
                      onClick={() => exportToCSV(wishes, 'wishes')}
                      size="sm"
                      disabled={wishes.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {wishes.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No wishes yet</p>
                ) : (
                  <>
                    {/* Select All Row */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                      <Checkbox
                        id="select-all-wishes"
                        checked={wishes.length > 0 && selectedWishes.size === wishes.length}
                        onCheckedChange={toggleAllWishes}
                      />
                      <label htmlFor="select-all-wishes" className="text-sm font-medium cursor-pointer">
                        Select All ({wishes.length})
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishes.map((wish, index) => (
                        <div key={wish.id || `wish-${index}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`wish-${wish.id}`}
                              checked={selectedWishes.has(wish.id)}
                              onCheckedChange={() => toggleWishSelection(wish.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Heart className="w-5 h-5 text-pink-500" weight="fill" />
                                  <h3 className="font-semibold">{wish.name}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 mr-2">
                                    {formatDate(wish.timestamp)}
                                  </span>
                                  <WishEditDialog wish={wish} onUpdate={updateWish} />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteWish(wish.id)}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-gray-700 italic bg-pink-50 p-3 rounded-md">
                                "{wish.message}"
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Uploaded Photos ({stats.totalPhotos})</CardTitle>
                {selectedPhotos.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={bulkDeletePhotos}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Selected ({selectedPhotos.size})
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No photos uploaded yet</p>
                ) : (
                  <>
                    {/* Select All Row */}
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                      <Checkbox
                        id="select-all-photos"
                        checked={photos.length > 0 && selectedPhotos.size === photos.length}
                        onCheckedChange={toggleAllPhotos}
                      />
                      <label htmlFor="select-all-photos" className="text-sm font-medium cursor-pointer">
                        Select All ({photos.length})
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={photo.id || `photo-${index}`} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group relative">
                          {/* Checkbox overlay - top left */}
                          <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                              id={`photo-${photo.id}`}
                              checked={selectedPhotos.has(photo.id)}
                              onCheckedChange={() => togglePhotoSelection(photo.id)}
                              className="bg-white border-2 shadow-md"
                            />
                          </div>
                          
                          <img 
                            src={photo.url} 
                            alt={photo.name}
                            className="w-full h-48 object-cover"
                          />
                          
                          {/* Delete button overlay - top right */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deletePhoto(photo.id)}
                              className="shadow-lg"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="p-2 bg-gray-50">
                            <p className="text-xs text-gray-600 truncate" title={photo.name}>
                              {photo.name}
                            </p>
                            {photo.caption && (
                              <p className="text-xs text-gray-500 italic truncate" title={photo.caption}>
                                {photo.caption}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              {photo.timestamp ? new Date(photo.timestamp).toLocaleDateString() : 
                               photo.uploadedAt ? new Date(photo.uploadedAt).toLocaleDateString() : 
                               'Recently'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
