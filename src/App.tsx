import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Baby, 
  Calendar, 
  MapPin, 
  Clock, 
  Heart, 
  Users, 
  Camera, 
  Share, 
  Download,
  Phone,
  ChatCircle,
  Gift,
  Star,
  GearSix
} from '@phosphor-icons/react'
import QRCodeComponent from './components/QRCodeComponent'
import PhotoGallery from './components/PhotoGallery'
import RSVPForm from './components/RSVPForm'
import GuestWishes from './components/GuestWishes'

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071'

function App() {
  const [rsvps, setRSVPs] = useState<RSVP[]>([])
  const [isLoadingRSVPs, setIsLoadingRSVPs] = useState(true)
  const [currentTab, setCurrentTab] = useState("invitation")
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  // Fetch RSVPs from backend
  useEffect(() => {
    const fetchRSVPs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rsvps`)
        console.log('RSVP Response status:', response.status)
        
        if (response.ok) {
          const text = await response.text()
          console.log('RSVP Response text:', text)
          
          if (text) {
            const data = JSON.parse(text)
            setRSVPs(data)
          } else {
            setRSVPs([])
          }
        } else {
          console.error('Response not ok:', response.status, response.statusText)
          setRSVPs([])
        }
      } catch (error) {
        console.error('Failed to fetch RSVPs:', error)
        setRSVPs([])
      } finally {
        setIsLoadingRSVPs(false)
      }
    }
    fetchRSVPs()
  }, [])

  useEffect(() => {
    setQrCodeUrl(window.location.href)
  }, [])

  const eventDetails = {
    babyName: "PARV",
    date: "Saturday, 15th November 2025",
    poojaTime: "5:30 PM",
    dinnerTime: "7:30 PM onwards",
    venue: "Hotel Chandra Inn",
    address: "Panch Batti Circle, Airport Road, Ratanada, Jodhpur",
    family: "Khilrani Family"
  }

  const attendingCount = rsvps?.filter(rsvp => rsvp.attending).length || 0
  const totalGuests = rsvps?.filter(rsvp => rsvp.attending).reduce((sum, rsvp) => sum + rsvp.guests, 0) || 0

  const shareWhatsApp = () => {
    const message = `🎉 You're invited to baby ${eventDetails.babyName}'s Welcome Ceremony! 
    
📅 ${eventDetails.date}
🕕 Pooja: ${eventDetails.poojaTime}
🍽️ Dinner: ${eventDetails.dinnerTime}
📍 ${eventDetails.venue}, ${eventDetails.address}

Join our WhatsApp group for updates: ${window.location.href}

With love,
${eventDetails.family} 💙`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const addToCalendar = () => {
    const startDate = new Date('2025-11-15T17:30:00').toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'
    const endDate = new Date('2025-11-15T22:00:00').toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Baby ${eventDetails.babyName} Welcome Ceremony`)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(`Welcome ceremony for baby ${eventDetails.babyName}. Pooja at ${eventDetails.poojaTime}, Dinner at ${eventDetails.dinnerTime}`)}&location=${encodeURIComponent(`${eventDetails.venue}, ${eventDetails.address}`)}`
    
    window.open(calendarUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-background baby-pattern">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Admin Link */}
        <div className="flex justify-end mb-4">
          <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <GearSix size={16} />
              Admin Panel
            </Button>
          </Link>
        </div>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="invitation" className="flex items-center gap-2">
              <Baby size={18} />
              Invitation
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="flex items-center gap-2">
              <Users size={18} />
              RSVP
            </TabsTrigger>
            <TabsTrigger value="wishes" className="flex items-center gap-2">
              <Heart size={18} />
              Wishes
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera size={18} />
              Photos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitation" className="space-y-6">
            {/* Main Invitation Card */}
            <Card className="relative overflow-hidden border-2 border-primary/20 glow">
              <div className="absolute top-4 right-4 floating">
                <Baby size={32} className="text-accent" />
              </div>
              <div className="absolute top-8 left-8 floating">
                <Gift size={24} className="text-secondary" />
              </div>
              <div className="absolute bottom-8 right-8 floating">
                <Star size={28} className="text-accent/70" />
              </div>
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center items-center gap-4 mb-4">
                  <Baby size={40} className="text-primary floating" />
                  <Gift size={32} className="text-accent floating" />
                  <Star size={36} className="text-secondary floating" />
                </div>
                
                <h1 className="font-script text-5xl md:text-6xl text-primary font-bold mb-2">
                  Welcome Ceremony
                </h1>
                <p className="text-xl text-destructive font-semibold tracking-wide">INVITATION</p>
                <p className="text-lg text-muted-foreground italic mt-2">
                  Celebrating the Arrival of our little bundle of joy
                </p>
              </CardHeader>

              <CardContent className="text-center space-y-6">
                <div className="bg-muted/50 rounded-lg p-6">
                  <p className="text-lg mb-4 leading-relaxed">
                    With immense joy and gratitude,<br />
                    We are delighted to announce the<br />
                    arrival of our sweet baby boy -
                  </p>
                  
                  <div className="font-script text-6xl md:text-7xl font-bold text-accent mb-4 drop-shadow-lg">
                    {eventDetails.babyName}
                  </div>
                  
                  <p className="text-lg font-medium">
                    Join us to celebrate his arrival and<br />
                    shower your blessings
                  </p>
                </div>

                {/* Event Details */}
                <Card className="bg-card border-accent/30">
                  <CardHeader>
                    <CardTitle className="text-center text-xl font-script text-accent bg-accent/10 py-2 px-4 rounded-full">
                      Programme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-primary" />
                      <span className="font-semibold text-destructive">Date:</span>
                      <span className="text-primary font-medium">{eventDetails.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-primary" />
                      <span className="font-semibold text-destructive">Pooja Bahrana Sahib Path:</span>
                      <span className="text-primary font-medium">{eventDetails.poojaTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-primary" />
                      <span className="font-semibold text-destructive">Dinner:</span>
                      <span className="text-primary font-medium">{eventDetails.dinnerTime}</span>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin size={20} className="text-primary mt-1" />
                      <div>
                        <span className="font-semibold text-destructive block">Venue:</span>
                        <span className="text-primary font-medium block">{eventDetails.venue}</span>
                        <span className="text-accent text-sm">{eventDetails.address}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <p className="text-xl text-primary font-medium">With Love & Regards</p>
                  <p className="text-2xl font-script text-destructive font-bold">{eventDetails.family}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <Button onClick={addToCalendar} className="bg-primary hover:bg-primary/90">
                    <Calendar size={18} className="mr-2" />
                    Add to Calendar
                  </Button>
                  
                  <Button onClick={shareWhatsApp} className="bg-green-600 hover:bg-green-700">
                    <ChatCircle size={18} className="mr-2" />
                    Share on WhatsApp
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                        <Share size={18} className="mr-2" />
                        QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Invitation</DialogTitle>
                      </DialogHeader>
                      <QRCodeComponent url={qrCodeUrl} />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* RSVP Status */}
                {rsvps && rsvps.length > 0 && (
                  <Card className="bg-accent/10 border-accent/30 mx-0">
                    <CardContent className="pt-6 pb-6 px-2 sm:px-4">
                      <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-6 w-full">
                        <Badge variant="secondary" className="text-xs sm:text-sm md:text-lg py-1.5 sm:py-2 px-2 sm:px-3 md:px-4 w-full max-w-[48%] md:max-w-none md:w-auto flex items-center justify-center">
                          <Users size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="truncate text-center">{attendingCount} Families</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs sm:text-sm md:text-lg py-1.5 sm:py-2 px-2 sm:px-3 md:px-4 w-full max-w-[48%] md:max-w-none md:w-auto flex items-center justify-center">
                          <Heart size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
                          <span className="truncate text-center">{totalGuests} Guests</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rsvp">
            <RSVPForm rsvps={rsvps || []} setRSVPs={setRSVPs} />
          </TabsContent>

          <TabsContent value="wishes">
            <GuestWishes />
          </TabsContent>

          <TabsContent value="photos">
            <PhotoGallery />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App