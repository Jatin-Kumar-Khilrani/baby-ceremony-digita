import { useState, useEffect, useRef, useMemo } from 'react'
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
import { TextToSpeech } from '@/components/TextToSpeech'
import { AudioProvider } from '@/contexts/AudioContext'
import { toast } from 'sonner'
import { 
  Users, 
  Heart, 
  Image as ImageIcon, 
  Download, 
  CheckCircle, 
  XCircle,
  Check,
  X,
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
    
    // Nov 15th (main event day) - BREAKFAST
    // Anyone who arrives BEFORE 10 AM on Nov 15 gets breakfast
    if (arrival) {
      const nov15Morning = new Date('2025-11-15T10:00:00')
      if (arrival < nov15Morning) {
        // Arrived before 10 AM Nov 15 = gets breakfast
        breakfast15 += guestCount
      }
    }
    
    // Nov 15th - LUNCH
    if (arrival) {
      const nov15Lunch = new Date('2025-11-15T14:00:00')
      if (arrival < nov15Lunch) {
        // Arrived before 2 PM Nov 15 = gets lunch
        lunch15 += guestCount
      }
    }
    
    // Nov 15th - DINNER
    if (arrival) {
      const nov15Dinner = new Date('2025-11-15T22:00:00')
      const departsBefore15Evening = departure && departure.getDate() === 15 && departure.getHours() < dinnerEnd
      
      if (!departsBefore15Evening && arrival < nov15Dinner) {
        // Arrived before 10 PM Nov 15 AND not leaving same evening = gets dinner
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
  allowDuplicateSubmission?: boolean // Admin privilege to bypass duplicate check
}

interface Wish {
  id: string
  name: string
  message: string
  email?: string
  gender?: 'male' | 'female' | 'other'
  defaultGender?: 'male' | 'female' // Admin override for TTS auto-detection
  audioUrl?: string | null
  audioDuration?: number | null
  hasAudio?: boolean
  // Moderation fields
  approved?: boolean
  moderatedBy?: string
  moderatedAt?: number
  rejectionReason?: string
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
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-xs text-blue-800">
                  <strong>📌 Note:</strong> If arrival time is not specified, assume guest will arrive for dinner on 15th November 2025 (Event Date).
                  Dinner is served at 8:00 PM.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="arrivalDateTime">Arrival Date & Time</Label>
                  <Input
                    id="arrivalDateTime"
                    type="datetime-local"
                    value={formData.arrivalDateTime || ''}
                    onChange={(e) => setFormData({ ...formData, arrivalDateTime: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty if arriving for dinner (8:00 PM on 15th Nov)</p>
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

                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Checkbox
                    id="allowDuplicateSubmission"
                    checked={formData.allowDuplicateSubmission || false}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowDuplicateSubmission: checked as boolean })}
                  />
                  <Label htmlFor="allowDuplicateSubmission" className="cursor-pointer">
                    <div className="flex flex-col">
                      <span className="font-medium">Allow Duplicate Submission</span>
                      <span className="text-xs text-gray-500 font-normal">
                        Bypass email/phone duplicate check (for VIPs, family, corrections)
                      </span>
                    </div>
                  </Label>
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

          <div>
            <Label htmlFor="defaultGender">Default Voice Gender (for TTS auto-detection)</Label>
            <Select 
              value={formData.defaultGender || 'auto'} 
              onValueChange={(value) => setFormData({ ...formData, defaultGender: value === 'auto' ? undefined : value as 'male' | 'female' })}
            >
              <SelectTrigger id="defaultGender">
                <SelectValue placeholder="Auto-detect from name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">🤖 Auto-detect from name</SelectItem>
                <SelectItem value="male">👨 Male Voice</SelectItem>
                <SelectItem value="female">👩 Female Voice</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Override auto-detection if the name doesn't match the person's gender
            </p>
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
  const [wishSearchQuery, setWishSearchQuery] = useState('')
  const [wishSortBy, setWishSortBy] = useState<'name' | 'date' | 'message'>('date')
  const [activeTab, setActiveTab] = useState<'rsvps' | 'wishes' | 'photos' | 'backups'>('rsvps')
  const rsvpSectionRef = useRef<HTMLDivElement>(null)
  const [backups, setBackups] = useState<any[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  
  // Audio amplification state for each wish
  const [wishAmplification, setWishAmplification] = useState<Record<string, number>>({})
  const [isAmplifying, setIsAmplifying] = useState<Record<string, boolean>>({})
  const [amplifiedAudioUrls, setAmplifiedAudioUrls] = useState<Record<string, string>>({})
  const [previewBackup, setPreviewBackup] = useState<any>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
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

  // Cleanup amplified audio URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(amplifiedAudioUrls).forEach(url => {
        if (url) {
          console.log('Admin Cleanup: Revoking amplified URL', url)
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [amplifiedAudioUrls])

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
      // Add cache-busting timestamp to prevent stale data
      const timestamp = Date.now()
      const [rsvpResponse, wishResponse, photoResponse] = await Promise.all([
        fetch(`${API_BASE}/rsvps?_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${API_BASE}/wishes?_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`${API_BASE}/photos?_t=${timestamp}`, { cache: 'no-store' })
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

  // Memoize filtered/sorted data (must be before early return to maintain hook order)
  const filteredRsvps = useMemo(() => {
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
          return b.timestamp - a.timestamp
        case 'guests':
          return (b.guests || 1) - (a.guests || 1)
        case 'status':
          if (a.attending === b.attending) return 0
          return a.attending ? -1 : 1
        case 'transport':
          if (a.transportNeeded === b.transportNeeded) {
            if (a.transportNeeded && a.transportMode && b.transportMode) {
              return a.transportMode.localeCompare(b.transportMode)
            }
            return 0
          }
          return a.transportNeeded ? -1 : 1
        case 'rooms':
          if ((a.roomNumber ? 1 : 0) === (b.roomNumber ? 1 : 0)) {
            if (a.roomNumber && b.roomNumber) {
              return a.roomNumber.localeCompare(b.roomNumber)
            }
            return 0
          }
          return a.roomNumber ? -1 : 1
        case 'meals':
          const aHasMeals = (a.arrivalDateTime || a.departureDateTime) ? 1 : 0
          const bHasMeals = (b.arrivalDateTime || b.departureDateTime) ? 1 : 0
          if (aHasMeals === bHasMeals) {
            if (a.arrivalDateTime && b.arrivalDateTime) {
              return new Date(a.arrivalDateTime).getTime() - new Date(b.arrivalDateTime).getTime()
            }
            return 0
          }
          return bHasMeals - aHasMeals
        default:
          return 0
      }
    })
    
    return filtered
  }, [rsvps, rsvpSearchQuery, rsvpSortBy])

  const filteredWishes = useMemo(() => {
    let filtered = [...wishes]
    
    // Apply search filter
    if (wishSearchQuery.trim()) {
      const query = wishSearchQuery.toLowerCase()
      filtered = filtered.filter(wish => 
        wish.name.toLowerCase().includes(query) ||
        wish.message.toLowerCase().includes(query)
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (wishSortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return b.timestamp - a.timestamp
        case 'message':
          return a.message.localeCompare(b.message)
        default:
          return 0
      }
    })
    
    return filtered
  }, [wishes, wishSearchQuery, wishSortBy])

  // Load backups when switching to backups tab (must be before auth check)
  useEffect(() => {
    if (activeTab === 'backups' && backups.length === 0 && isAuthenticated) {
      loadBackups()
    }
  }, [activeTab, isAuthenticated, backups.length])

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

  // Backup & Restore Functions
  const getAdminKey = () => {
    return sessionStorage.getItem('adminKey') || 'your-secret-admin-key-change-this'
  }

  const loadBackups = async () => {
    setLoadingBackups(true)
    try {
      const response = await fetch(`${API_BASE}/backup`, {
        headers: {
          'x-admin-key': getAdminKey()
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBackups(data)
        toast.success(`Loaded ${data.length} backup(s)`)
      } else {
        toast.error('Failed to load backups')
      }
    } catch (error) {
      console.error('Error loading backups:', error)
      toast.error('Error loading backups')
    } finally {
      setLoadingBackups(false)
    }
  }

  const createBackup = async () => {
    try {
      const response = await fetch(`${API_BASE}/backup?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': getAdminKey()
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        const backupSummary = result.backups
          .filter((b: any) => !b.error)
          .map((b: any) => `${b.itemCount} ${b.dataType}`)
          .join(', ')
        toast.success(`Backup created: ${backupSummary}`)
        loadBackups() // Refresh list
      } else {
        toast.error('Failed to create backup')
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      toast.error('Error creating backup')
    }
  }

  const restoreBackup = async (backupGroup: string, dataTypes?: string[]) => {
    const dataTypeNames = dataTypes ? dataTypes.join(', ') : 'all data (RSVPs, Wishes, Photos)'
    if (!confirm(`Are you sure you want to restore from this backup?\n\n⚠️ This will REPLACE ${dataTypeNames}!\n\nBackup: ${backupGroup}`)) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/backup?action=restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': getAdminKey()
        },
        body: JSON.stringify({ 
          backupGroup,
          ...(dataTypes && { dataTypes })
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        const restored = result.restored
          .filter((r: any) => !r.error)
          .map((r: any) => `${r.itemCount} ${r.dataType}`)
          .join(', ')
        toast.success(`Restored: ${restored}`)
        
        // Reload all data
        fetchAllData()
      } else {
        toast.error('Failed to restore backup')
      }
    } catch (error) {
      console.error('Error restoring backup:', error)
      toast.error('Error restoring backup')
    }
  }

  const downloadBackup = async (backupGroup: string) => {
    try {
      const response = await fetch(`${API_BASE}/backup?action=download&backupGroup=${backupGroup}`, {
        headers: {
          'x-admin-key': getAdminKey(),
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download backup')
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename="')[1].split('"')[0]
        : `backup-${backupGroup}.json`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`✅ Backup downloaded: ${filename}`)
    } catch (error) {
      console.error('Error downloading backup:', error)
      toast.error('Error downloading backup')
    }
  }

  const previewBackupData = async (backupGroup: string) => {
    try {
      const response = await fetch(`${API_BASE}/backup?action=download&backupGroup=${backupGroup}`, {
        headers: {
          'x-admin-key': getAdminKey(),
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load backup')
      }

      const data = await response.json()
      console.log('Backup data received:', data)
      console.log('RSVPs:', data.data?.rsvps)
      console.log('Wishes:', data.data?.wishes)
      console.log('Photos:', data.data?.photos)
      setPreviewBackup(data)
      setShowPreviewModal(true)
    } catch (error) {
      console.error('Error loading backup:', error)
      toast.error('Error loading backup preview')
    }
  }

  const deleteBackup = async (backupGroup: string) => {
    if (!confirm(`Are you sure you want to delete this backup group?\n\nThis will delete all files (RSVPs, Wishes, Photos) for:\n${backupGroup}`)) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/backup?action=delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': getAdminKey()
        },
        body: JSON.stringify({ backupGroup })
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`Deleted ${result.deleted.length} backup file(s)`)
        loadBackups() // Refresh list
      } else {
        toast.error('Failed to delete backup')
      }
    } catch (error) {
      console.error('Error deleting backup:', error)
      toast.error('Error deleting backup')
    }
  }

  const formatBackupDate = (timestamp: string) => {
    if (!timestamp) return 'Unknown date'
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
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

  // Approve Wish
  const approveWish = async (wishId: string) => {
    try {
      const updatedWishes = wishes.map(w => 
        w.id === wishId 
          ? { 
              ...w, 
              approved: true, 
              moderatedBy: 'Admin', 
              moderatedAt: Date.now(), 
              rejectionReason: null
              // IMPORTANT: Preserve defaultGender if it was set by admin
              // This is already in the spread (...w), so no need to explicitly add it
            }
          : w
      )
      
      const response = await fetch(`${API_BASE}/wishes?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWishes)
      })

      if (response.ok) {
        toast.success('Wish approved! ✅')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to approve wish')
      console.error(error)
    }
  }

  // Reject Wish
  const rejectWish = async (wishId: string, reason?: string) => {
    try {
      const updatedWishes = wishes.map(w => 
        w.id === wishId 
          ? { ...w, approved: false, moderatedBy: 'Admin', moderatedAt: Date.now(), rejectionReason: reason || 'Rejected by admin' }
          : w
      )
      
      const response = await fetch(`${API_BASE}/wishes?action=replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWishes)
      })

      if (response.ok) {
        toast.success('Wish rejected')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to reject wish')
      console.error(error)
    }
  }

  // Audio Amplification Functions
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numberOfChannels = buffer.numberOfChannels
    const length = buffer.length * numberOfChannels * 2
    const arrayBuffer = new ArrayBuffer(44 + length)
    const view = new DataView(arrayBuffer)
    const channels: Float32Array[] = []
    let offset = 0
    let pos = 0

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true)
      pos += 2
    }
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true)
      pos += 4
    }

    // "RIFF" chunk descriptor
    setUint32(0x46464952) // "RIFF"
    setUint32(36 + length) // file length - 8
    setUint32(0x45564157) // "WAVE"

    // "fmt " sub-chunk
    setUint32(0x20746d66) // "fmt "
    setUint32(16) // chunk size
    setUint16(1) // audio format (1 = PCM)
    setUint16(numberOfChannels)
    setUint32(buffer.sampleRate)
    setUint32(buffer.sampleRate * 2 * numberOfChannels) // byte rate
    setUint16(numberOfChannels * 2) // block align
    setUint16(16) // bits per sample

    // "data" sub-chunk
    setUint32(0x61746164) // "data"
    setUint32(length)

    // Write interleaved data
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i))
    }

    while (pos < arrayBuffer.byteLength) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]))
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  const amplifyWishAudio = async (wishId: string, gainValue: number) => {
    const wish = wishes.find(w => w.id === wishId)
    if (!wish?.audioUrl) {
      toast.error('No audio found for this wish')
      return
    }

    setIsAmplifying(prev => ({ ...prev, [wishId]: true }))

    try {
      // Fetch the audio file
      const response = await fetch(wish.audioUrl)
      const arrayBuffer = await response.arrayBuffer()

      // Create audio context
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      )

      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer

      // Create gain node for amplification
      const gainNode = offlineContext.createGain()
      gainNode.gain.value = gainValue

      // Connect nodes
      source.connect(gainNode)
      gainNode.connect(offlineContext.destination)

      // Start processing
      source.start(0)

      // Render audio
      const renderedBuffer = await offlineContext.startRendering()

      // Convert back to blob
      const wavBlob = audioBufferToWav(renderedBuffer)

      // Create new URL for amplified audio
      const newUrl = URL.createObjectURL(wavBlob)
      console.log('Admin Amplification: Created new URL for wish', wishId, newUrl)

      // Store the amplified URL
      setAmplifiedAudioUrls(prev => {
        // Revoke old URL if it exists
        if (prev[wishId]) {
          console.log('Admin Amplification: Revoking old URL', prev[wishId])
          URL.revokeObjectURL(prev[wishId])
        }
        return { ...prev, [wishId]: newUrl }
      })

      toast.success(`Audio amplified to ${Math.round(gainValue * 100)}%`)
    } catch (error) {
      console.error('Amplification error:', error)
      toast.error('Failed to amplify audio')
    } finally {
      setIsAmplifying(prev => ({ ...prev, [wishId]: false }))
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
    <AudioProvider>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
              <TabsTrigger value="wishes">Wishes</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="backups">Backups</TabsTrigger>
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
                                    {rsvp.allowDuplicateSubmission && (
                                      <Badge className="bg-amber-100 text-amber-800 text-xs">
                                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        Bypass Enabled
                                      </Badge>
                                    )}
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
                    {/* Search and Sort Controls */}
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Search Input */}
                        <div className="relative">
                          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="text"
                            placeholder="Search by name or message..."
                            value={wishSearchQuery}
                            onChange={(e) => setWishSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                          <SortAscending className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <Select 
                            value={wishSortBy} 
                            onValueChange={(value: any) => setWishSortBy(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="date">📅 Most Recent</SelectItem>
                              <SelectItem value="name">👤 Name (A-Z)</SelectItem>
                              <SelectItem value="message">💬 Message (A-Z)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Results Counter */}
                      {wishSearchQuery && (
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Found {filteredWishes.length} of {wishes.length} wishes
                        </div>
                      )}
                    </div>

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
                      {filteredWishes.map((wish, index) => (
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Heart className="w-5 h-5 text-pink-500" weight="fill" />
                                  <h3 className="font-semibold">{wish.name}</h3>
                                  {wish.hasAudio && (
                                    <Badge variant="secondary" className="text-xs">
                                      🎙️ Audio
                                    </Badge>
                                  )}
                                  {/* Moderation Status */}
                                  {wish.approved === true && (
                                    <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-200">
                                      ✅ Approved
                                    </Badge>
                                  )}
                                  {wish.approved === false && (
                                    <Badge className="text-xs bg-red-100 text-red-700 hover:bg-red-200">
                                      ⛔ Pending
                                    </Badge>
                                  )}
                                  {wish.approved === undefined && (
                                    <Badge variant="secondary" className="text-xs">
                                      ⏳ Legacy
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-gray-500">
                                    {formatDate(wish.timestamp)}
                                  </span>
                                  {/* Moderation Actions */}
                                  {wish.approved !== true && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => approveWish(wish.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                      title="Approve wish"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {wish.approved !== false && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => rejectWish(wish.id)}
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                      title="Reject wish"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  )}
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
                              
                              {/* Audio Player - Show FIRST for moderation */}
                              {wish.hasAudio && wish.audioUrl && (
                                <div className="mb-3 space-y-3 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-2 border-purple-300">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-purple-900">
                                        🎙️ User Audio Recording
                                      </span>
                                      {wish.audioDuration && (
                                        <Badge variant="secondary" className="text-xs">
                                          {Math.floor(wish.audioDuration / 60)}:{(wish.audioDuration % 60).toString().padStart(2, '0')}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Audio Player */}
                                  <audio 
                                    key={amplifiedAudioUrls[wish.id] || wish.audioUrl}
                                    src={amplifiedAudioUrls[wish.id] || wish.audioUrl}
                                    controls 
                                    controlsList="nodownload"
                                    className="w-full"
                                    preload="metadata"
                                  />
                                  
                                  {/* Volume Amplification Controls */}
                                  <div className="space-y-2 p-3 bg-purple-100/50 border border-purple-300 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <label className="text-sm font-medium text-purple-900">
                                        🔊 Amplify Volume
                                      </label>
                                      <span className="text-xs text-purple-700 font-semibold">
                                        {Math.round((wishAmplification[wish.id] || 1) * 100)}%
                                      </span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0.5"
                                      max="3"
                                      step="0.1"
                                      value={wishAmplification[wish.id] || 1}
                                      onChange={(e) => setWishAmplification(prev => ({ 
                                        ...prev, 
                                        [wish.id]: parseFloat(e.target.value) 
                                      }))}
                                      className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                      disabled={isAmplifying[wish.id]}
                                      aria-label="Volume amplification slider"
                                    />
                                    <div className="flex items-center justify-between text-xs text-purple-600">
                                      <span>50%</span>
                                      <span>100% (Original)</span>
                                      <span>300%</span>
                                    </div>
                                    <Button
                                      type="button"
                                      onClick={() => amplifyWishAudio(wish.id, wishAmplification[wish.id] || 1)}
                                      className="w-full bg-purple-600 hover:bg-purple-700"
                                      size="sm"
                                      disabled={isAmplifying[wish.id] || (wishAmplification[wish.id] || 1) === 1}
                                    >
                                      {isAmplifying[wish.id] ? 'Processing...' : 'Apply Amplification'}
                                    </Button>
                                    <p className="text-xs text-purple-700 italic">
                                      Adjust slider and click Apply to change volume. Original audio is preserved.
                                    </p>
                                  </div>
                                  
                                  {/* Moderation Tips */}
                                  <div className="flex items-start gap-2 text-xs text-purple-700">
                                    <span>💡</span>
                                    <div className="flex-1">
                                      <p className="font-medium">Moderation Tips:</p>
                                      <ul className="list-disc list-inside space-y-1 mt-1">
                                        <li>Listen to full recording before approving</li>
                                        <li>Use amplification if audio is too quiet</li>
                                        <li>Use browser volume control for fine-tuning</li>
                                        <li>Check for inappropriate content</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Text Message */}
                              {wish.message && (
                                <p className="text-gray-700 italic bg-pink-50 p-3 rounded-md mb-3">
                                  "{wish.message}"
                                </p>
                              )}
                              
                              {/* Text-to-Speech for TEXT wishes */}
                              {wish.message && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  {wish.defaultGender && (
                                    <div className="mb-2 px-3 py-1 bg-purple-100 border border-purple-300 rounded text-xs font-medium text-purple-700">
                                      🎭 Admin Voice Override: {wish.defaultGender === 'male' ? '👨 Male' : '👩 Female'}
                                    </div>
                                  )}
                                  <TextToSpeech 
                                    text={wish.message} 
                                    senderName={wish.name}
                                    senderGender={wish.defaultGender || wish.gender}
                                    showVoiceSelector={true}
                                    instanceId={wish.id}
                                  />
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

          {/* Backups Tab */}
          <TabsContent value="backups">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Backup & Restore</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      onClick={loadBackups}
                      variant="outline"
                      size="sm"
                      disabled={loadingBackups}
                    >
                      {loadingBackups ? 'Loading...' : 'Refresh'}
                    </Button>
                    <Button 
                      onClick={createBackup}
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Create Backup Now
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Info Banner */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📦 Comprehensive Backup System</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Backups include <strong>RSVPs, Wishes (with audio), and Photos</strong></li>
                      <li>• Audio wishes are backed up with full audio file references</li>
                      <li>• Automated backups run daily at 2:00 AM UTC</li>
                      <li>• Backups are kept for 30 days, then automatically deleted</li>
                      <li>• You can restore all data together or individually</li>
                      <li>• Manual backups can be created anytime</li>
                    </ul>
                  </div>

                  {/* Backups List */}
                  {loadingBackups ? (
                    <div className="text-center py-8 text-gray-500">Loading backups...</div>
                  ) : backups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No backups found. Create your first backup using the button above.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-700 mb-3">
                        Available Backups ({backups.length})
                      </h4>
                      {backups.map((backup) => (
                        <div 
                          key={backup.backupGroup || backup.name} 
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex flex-col gap-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {formatBackupDate(backup.timestamp)}
                                </span>
                                <Badge variant={backup.createdBy === 'scheduled-backup' ? 'default' : 'secondary'}>
                                  {backup.createdBy === 'scheduled-backup' ? 'Auto' : 'Manual'}
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => previewBackupData(backup.backupGroup || backup.name)}
                                  title="View backup contents"
                                >
                                  <MagnifyingGlass className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadBackup(backup.backupGroup || backup.name)}
                                  title="Download backup to your computer"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteBackup(backup.backupGroup || backup.name)}
                                >
                                  <Trash className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Data Breakdown */}
                            <div className="grid grid-cols-4 gap-2">
                              <div className="bg-purple-50 border border-purple-200 rounded p-2 text-center">
                                <div className="text-xs text-purple-600 font-medium">RSVPs</div>
                                <div className="text-lg font-bold text-purple-900">{backup.rsvps || 0}</div>
                              </div>
                              <div className="bg-pink-50 border border-pink-200 rounded p-2 text-center">
                                <div className="text-xs text-pink-600 font-medium">Wishes</div>
                                <div className="text-lg font-bold text-pink-900">{backup.wishes || 0}</div>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 text-center">
                                <div className="text-xs text-blue-600 font-medium">🎙️ Audio</div>
                                <div className="text-lg font-bold text-blue-900">{backup.audioWishes || 0}</div>
                              </div>
                              <div className="bg-indigo-50 border border-indigo-200 rounded p-2 text-center">
                                <div className="text-xs text-indigo-600 font-medium">Photos</div>
                                <div className="text-lg font-bold text-indigo-900">{backup.photos || 0}</div>
                              </div>
                            </div>

                            {/* Total Count */}
                            <div className="text-sm text-gray-600 text-center py-1 bg-gray-100 rounded">
                              <strong>Total:</strong> {backup.totalItems || (backup.rsvps || 0) + (backup.wishes || 0) + (backup.photos || 0)} items
                              {backup.audioWishes > 0 && (
                                <span className="ml-2 text-blue-600">• {backup.audioWishes} with audio</span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                              {/* Restore All */}
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full"
                                onClick={() => restoreBackup(backup.backupGroup || backup.name)}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Restore All Data
                              </Button>

                              {/* Individual Restore Options */}
                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreBackup(backup.backupGroup || backup.name, ['rsvps'])}
                                  className="text-xs"
                                >
                                  RSVPs Only
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreBackup(backup.backupGroup || backup.name, ['wishes'])}
                                  className="text-xs"
                                >
                                  Wishes Only
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => restoreBackup(backup.backupGroup || backup.name, ['photos'])}
                                  className="text-xs"
                                >
                                  Photos Only
                                </Button>
                              </div>
                            </div>

                            {/* File Details (collapsible) */}
                            <details className="text-xs text-gray-500">
                              <summary className="cursor-pointer hover:text-gray-700">
                                View backup files ({backup.files?.length || 3})
                              </summary>
                              <div className="mt-2 space-y-1 pl-4">
                                {backup.files?.map((file: any) => (
                                  <div key={file.name} className="flex justify-between">
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-gray-400 ml-2">{file.itemCount} items</span>
                                  </div>
                                )) || (
                                  <div className="text-gray-400">Legacy backup format</div>
                                )}
                              </div>
                            </details>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Backup Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Backup Preview - {previewBackup?.backupGroup}</DialogTitle>
          </DialogHeader>
          
          {previewBackup && (
            <div className="space-y-4">
              {/* Debug Info */}
              <details className="text-xs bg-gray-50 p-2 rounded">
                <summary className="cursor-pointer font-mono">Debug: Show Raw Data Structure</summary>
                <pre className="mt-2 overflow-auto max-h-40 bg-white p-2 rounded border">
                  {JSON.stringify(previewBackup, null, 2)}
                </pre>
              </details>

              {/* Summary */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {previewBackup.data?.rsvps?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">RSVPs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">
                      {previewBackup.data?.wishes?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Wishes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {previewBackup.data?.wishes?.filter((w: any) => w.hasAudio || w.audioUrl)?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">🎙️ Audio Wishes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {previewBackup.data?.photos?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Photos</div>
                  </div>
                </div>
              </div>

              {/* RSVPs */}
              {previewBackup.data?.rsvps?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-purple-700">RSVPs</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-purple-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left">Guests</th>
                          <th className="p-2 text-left">Attending</th>
                          <th className="p-2 text-left">Room</th>
                          <th className="p-2 text-left">Admin States</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewBackup.data.rsvps.map((rsvp: any, idx: number) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="p-2">{rsvp.name}</td>
                            <td className="p-2">{rsvp.email}</td>
                            <td className="p-2">{rsvp.guests || 1}</td>
                            <td className="p-2">
                              {rsvp.attending ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </td>
                            <td className="p-2">
                              {rsvp.roomNumber && (
                                <Badge variant="outline" className="text-xs">
                                  {rsvp.roomNumber}
                                </Badge>
                              )}
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {rsvp.transportNeeded && (
                                  <Badge variant="outline" className="text-xs bg-blue-50">🚗 Transport</Badge>
                                )}
                                {rsvp.allowDuplicateSubmission && (
                                  <Badge variant="outline" className="text-xs bg-amber-50">🔑 Bypass</Badge>
                                )}
                                {rsvp.adminNotes && (
                                  <Badge variant="outline" className="text-xs bg-gray-50">📝 Notes</Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Wishes */}
              {previewBackup.data?.wishes?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-pink-700">Wishes</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {previewBackup.data.wishes.map((wish: any, idx: number) => (
                      <div key={idx} className="border rounded p-3 bg-pink-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{wish.name}</div>
                            {(wish.hasAudio || wish.audioUrl) && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                🎙️ Audio
                              </Badge>
                            )}
                            {wish.defaultGender && (
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                🎤 {wish.defaultGender === 'male' ? '♂️ Male' : '♀️ Female'} Voice
                              </Badge>
                            )}
                            {wish.approved === true && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                ✓ Approved
                              </Badge>
                            )}
                            {wish.approved === false && (
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                                ✗ Rejected
                              </Badge>
                            )}
                          </div>
                          {wish.audioDuration && (
                            <div className="text-xs text-blue-600 font-medium">
                              {Math.floor(wish.audioDuration / 60)}:{(wish.audioDuration % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>
                        {wish.message && (
                          <div className="text-sm text-gray-600 mt-1">{wish.message}</div>
                        )}
                        {(wish.hasAudio || wish.audioUrl) && (
                          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-pink-200">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-600">Audio Details:</span>
                              {wish.audioUrl && (
                                <span className="truncate max-w-xs" title={wish.audioUrl}>
                                  {wish.audioUrl.split('/').pop() || 'audio-file.wav'}
                                </span>
                              )}
                            </div>
                            {wish.audioDuration && (
                              <div className="text-xs text-gray-400 mt-1">
                                Duration: {wish.audioDuration}s
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {previewBackup.data?.photos?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-indigo-700">Photos</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-indigo-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Caption</th>
                          <th className="p-2 text-left">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewBackup.data.photos.map((photo: any, idx: number) => (
                          <tr key={idx} className="border-t hover:bg-gray-50">
                            <td className="p-2">{photo.name}</td>
                            <td className="p-2">{photo.caption || '-'}</td>
                            <td className="p-2">
                              {photo.timestamp 
                                ? new Date(photo.timestamp).toLocaleDateString() 
                                : photo.uploadedAt 
                                ? new Date(photo.uploadedAt).toLocaleDateString()
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Download Button in Modal */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    downloadBackup(previewBackup.backupGroup)
                    setShowPreviewModal(false)
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AudioProvider>
  )
}

