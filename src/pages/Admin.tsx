import { useState, useEffect } from 'react'
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
  SignOut
} from '@phosphor-icons/react'

const API_BASE = import.meta.env.DEV ? 'http://localhost:7071/api' : '/api'

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
  const [stats, setStats] = useState({
    totalRsvps: 0,
    attending: 0,
    notAttending: 0,
    totalGuests: 0,
    totalWishes: 0,
    totalPhotos: 0
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

      console.log('Photo API Response:', photoData)
      console.log('Photo Response Status:', photoResponse.status)

      setRsvps(Array.isArray(rsvpData) ? rsvpData : [rsvpData].filter(Boolean))
      setWishes(Array.isArray(wishData) ? wishData : [wishData].filter(Boolean))
      setPhotos(Array.isArray(photoData) ? photoData : [photoData].filter(Boolean))

      console.log('Photos state set to:', Array.isArray(photoData) ? photoData : [photoData].filter(Boolean))

      // Calculate stats
      const rsvpArray = Array.isArray(rsvpData) ? rsvpData : [rsvpData].filter(Boolean)
      const attending = rsvpArray.filter((r: RSVP) => r.attending)
      const totalGuests = attending.reduce((sum: number, r: RSVP) => sum + (r.guests || 1), 0)

      setStats({
        totalRsvps: rsvpArray.length,
        attending: attending.length,
        notAttending: rsvpArray.filter((r: RSVP) => !r.attending).length,
        totalGuests,
        totalWishes: Array.isArray(wishData) ? wishData.length : (wishData ? 1 : 0),
        totalPhotos: Array.isArray(photoData) ? photoData.length : (photoData ? 1 : 0)
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card key="stat-total-rsvps">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold">{stats.totalRsvps}</div>
                <div className="text-sm text-gray-600">Total RSVPs</div>
              </div>
            </CardContent>
          </Card>

          <Card key="stat-attending">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">{stats.attending}</div>
                <div className="text-sm text-gray-600">Attending</div>
              </div>
            </CardContent>
          </Card>

          <Card key="stat-not-attending">
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">{stats.notAttending}</div>
                <div className="text-sm text-gray-600">Not Attending</div>
              </div>
            </CardContent>
          </Card>

          <Card key="stat-total-guests">
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">{stats.totalGuests}</div>
                <div className="text-sm text-gray-600">Total Guests</div>
              </div>
            </CardContent>
          </Card>

          <Card key="stat-wishes">
            <CardContent className="pt-6">
              <div className="text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-pink-600" />
                <div className="text-2xl font-bold">{stats.totalWishes}</div>
                <div className="text-sm text-gray-600">Wishes</div>
              </div>
            </CardContent>
          </Card>

          <Card key="stat-photos">
            <CardContent className="pt-6">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
                <div className="text-2xl font-bold">{stats.totalPhotos}</div>
                <div className="text-sm text-gray-600">Photos</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rsvps" className="space-y-4">
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
                      {rsvps.map((rsvp, index) => (
                        <div key={rsvp.id || `rsvp-${index}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={selectedRsvps.has(rsvp.id)}
                              onCheckedChange={() => toggleRsvpSelection(rsvp.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg">{rsvp.name}</h3>
                                      <div className="flex gap-2 mt-1">
                                    {rsvp.attending ? (
                                      <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Attending
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-800">
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Not Attending
                                      </Badge>
                                    )}
                                    <Badge variant="outline">
                                      <Users className="w-3 h-3 mr-1" />
                                      {rsvp.guests} {rsvp.guests === 1 ? 'guest' : 'guests'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500 mr-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    {formatDate(rsvp.timestamp)}
                                  </span>
                                  <RSVPEditDialog rsvp={rsvp} onUpdate={updateRSVP} />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteRSVP(rsvp.id)}
                                  >
                                    <Trash className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                <div>
                                  <EnvelopeSimple className="w-4 h-4 inline mr-1 text-gray-400" />
                                  <a href={`mailto:${rsvp.email}`} className="text-blue-600 hover:underline">
                                    {rsvp.email}
                                  </a>
                                </div>
                                <div>
                                  <PhoneIcon className="w-4 h-4 inline mr-1 text-gray-400" />
                                  <a href={`tel:${rsvp.phone}`} className="text-blue-600 hover:underline">
                                    {rsvp.phone}
                                  </a>
                                </div>
                              </div>

                              {rsvp.dietaryRestrictions && (
                                <div className="mt-2 text-sm">
                                  <strong>Dietary Restrictions:</strong> {rsvp.dietaryRestrictions}
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
  )
}
