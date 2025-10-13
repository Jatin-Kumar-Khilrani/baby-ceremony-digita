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
  GearSix,
  Copy
} from '@phosphor-icons/react'
import QRCodeComponent from './components/QRCodeComponent'
import PhotoGallery from './components/PhotoGallery'
import RSVPForm from './components/RSVPForm'
import WelcomeScreen from './components/WelcomeScreen'
import TourGuide from './components/TourGuide'
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
  // Travel & Accommodation
  arrivalDateTime?: string
  departureDateTime?: string
  transportNeeded?: boolean
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

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:7071/api' : '/api')

function App() {
  const [rsvps, setRSVPs] = useState<RSVP[]>([])
  const [currentTab, setCurrentTab] = useState("invitation")
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [showWelcome, setShowWelcome] = useState(true)

  // Check if user has seen welcome screen
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('baby-ceremony-welcome-seen')
    if (hasSeenWelcome) {
      setShowWelcome(false)
    }
  }, [])

  const handleContinueFromWelcome = () => {
    localStorage.setItem('baby-ceremony-welcome-seen', 'true')
    setShowWelcome(false)
  }

  // Removed automatic RSVP fetch - data is only loaded when:
  // 1. Admin page loads (handled in Admin.tsx)
  // 2. User searches for their specific RSVP (handled in RSVPForm.tsx)

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

    const shareOnWhatsApp = () => {
    // Using String.fromCodePoint for explicit emoji conversion - guaranteed to work
    const party = String.fromCodePoint(0x1F389)  // 🎉
    const baby = String.fromCodePoint(0x1F476)   // 👶
    const heart = String.fromCodePoint(0x1F499)  // 💙
    const calendar = String.fromCodePoint(0x1F4C5) // 📅
    const pray = String.fromCodePoint(0x1F64F)   // 🙏
    const clock = String.fromCodePoint(0x23F0)   // ⏰
    const fork = String.fromCodePoint(0x1F37D)   // 🍽️
    const pin = String.fromCodePoint(0x1F4CD)    // 📍
    const sparkle = String.fromCodePoint(0x2728) // ✨
    const link = String.fromCodePoint(0x1F517)   // 🔗
    const love = String.fromCodePoint(0x1F495)   // 💕
    
    const message = `${party} *WELCOME CEREMONY INVITATION* ${party}

${baby} *Celebrating Baby ${eventDetails.babyName.toUpperCase()}* ${heart}
Our Little Bundle of Joy!

${calendar} *Date:* ${eventDetails.date}

${pray} *Poojya पूज्य Bahrana Sahib Path*
${clock} Time: ${eventDetails.poojaTime}

${fork} *Dinner*
${clock} Time: ${eventDetails.dinnerTime}

${pin} *Venue:*
${eventDetails.venue}
${eventDetails.address}

${sparkle} Join us to celebrate and bless baby ${eventDetails.babyName}! ${sparkle}

${link} *RSVP & Share Wishes:*
${window.location.href}

${love} With Love,
*${eventDetails.family}*`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const copyInvitationMessage = async () => {
    // Using String.fromCodePoint for explicit emoji conversion - guaranteed to work
    const party = String.fromCodePoint(0x1F389)  // 🎉
    const baby = String.fromCodePoint(0x1F476)   // 👶
    const heart = String.fromCodePoint(0x1F499)  // 💙
    const calendar = String.fromCodePoint(0x1F4C5) // 📅
    const pray = String.fromCodePoint(0x1F64F)   // 🙏
    const clock = String.fromCodePoint(0x23F0)   // ⏰
    const fork = String.fromCodePoint(0x1F37D)   // 🍽️
    const pin = String.fromCodePoint(0x1F4CD)    // 📍
    const sparkle = String.fromCodePoint(0x2728) // ✨
    const link = String.fromCodePoint(0x1F517)   // 🔗
    const love = String.fromCodePoint(0x1F495)   // 💕
    
    const message = `${party} *WELCOME CEREMONY INVITATION* ${party}

${baby} *Celebrating Baby ${eventDetails.babyName.toUpperCase()}* ${heart}
Our Little Bundle of Joy!

${calendar} *Date:* ${eventDetails.date}

${pray} *Poojya पूज्य Bahrana Sahib Path*
${clock} Time: ${eventDetails.poojaTime}

${fork} *Dinner*
${clock} Time: ${eventDetails.dinnerTime}

${pin} *Venue:*
${eventDetails.venue}
${eventDetails.address}

${sparkle} Join us to celebrate and bless baby ${eventDetails.babyName}! ${sparkle}

${link} *RSVP & Share Wishes:*
${window.location.href}

${love} With Love,
*${eventDetails.family}*`
    
    try {
      await navigator.clipboard.writeText(message)
      toast.success('Invitation message copied!')
    } catch (err) {
      toast.error('Failed to copy message')
    }
  }

  const addToCalendar = () => {
    const startDate = new Date('2025-11-15T17:30:00').toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'
    const endDate = new Date('2025-11-15T22:00:00').toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Baby ${eventDetails.babyName} Welcome Ceremony`)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(`Welcome ceremony for baby ${eventDetails.babyName}. Poojya पूज्य at ${eventDetails.poojaTime}, Dinner at ${eventDetails.dinnerTime}`)}&location=${encodeURIComponent(`${eventDetails.venue}, ${eventDetails.address}`)}`
    
    window.open(calendarUrl, '_blank')
  }

  return (
    <>
      {showWelcome ? (
        <WelcomeScreen onContinue={handleContinueFromWelcome} />
      ) : (
        <div className="min-h-screen bg-background baby-pattern">
          <TourGuide />
          <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Admin Link & Reset Welcome */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('baby-ceremony-welcome-seen')
              localStorage.removeItem('baby-ceremony-tour-completed')
              window.location.reload()
            }}
            className="text-muted-foreground hover:text-primary"
            title="Reset Welcome Screen"
          >
            <Star size={16} className="mr-1" />
            Reset
          </Button>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <GearSix size={16} />
              Admin Panel
            </Button>
          </Link>
        </div>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="invitation" className="flex items-center gap-2" data-tour="invitation">
              <Baby size={18} />
              Invitation
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="flex items-center gap-2" data-tour="rsvp">
              <Users size={18} />
              RSVP
            </TabsTrigger>
            <TabsTrigger value="wishes" className="flex items-center gap-2" data-tour="wishes">
              <Heart size={18} />
              Wishes
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2" data-tour="photos">
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
                <p className="text-lg italic mt-2 font-medium" style={{ color: 'var(--teal-accent)' }}>
                  Celebrating the Arrival of our little bundle of joy
                </p>
              </CardHeader>

              <CardContent className="text-center space-y-6">
                <div className="bg-muted/50 rounded-lg p-6">
                  <p className="text-lg mb-4 leading-relaxed" style={{ color: 'var(--warm-brown)' }}>
                    With immense joy and gratitude,<br />
                    We are delighted to announce the<br />
                    arrival of our sweet baby boy -
                  </p>
                  
                  <div className="font-script text-6xl md:text-7xl font-bold text-accent mb-4 drop-shadow-lg">
                    {eventDetails.babyName}
                  </div>
                  
                  <p className="text-lg font-medium" style={{ color: 'var(--warm-brown)' }}>
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
                      <span className="font-medium" style={{ color: 'var(--ink-blue)' }}>{eventDetails.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-primary" />
                      <span className="font-semibold text-destructive">Poojya पूज्य Bahrana Sahib Path:</span>
                      <span className="font-medium" style={{ color: 'var(--ink-blue)' }}>{eventDetails.poojaTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-primary" />
                      <span className="font-semibold text-destructive">Dinner:</span>
                      <span className="font-medium" style={{ color: 'var(--ink-blue)' }}>{eventDetails.dinnerTime}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin size={20} className="text-primary" />
                      <span className="font-semibold text-destructive">Venue:</span>
                      <span className="font-medium" style={{ color: 'var(--ink-blue)' }}>{eventDetails.venue}, {eventDetails.address}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2 border-t border-accent/20">
                      <Phone size={20} className="text-primary" />
                      <div>
                        <span className="font-semibold text-destructive">Contact:</span>
                        <a 
                          href="tel:+919772854400" 
                          className="font-medium ml-2 hover:underline"
                          style={{ color: 'var(--ink-blue)' }}
                        >
                          +91-9772854400
                        </a>
                        <span className="text-muted-foreground text-sm ml-2">(Mr Rajendra Kumar Khilrani)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-center">
                  <p className="text-xl text-primary font-medium">With Love & Regards</p>
                  <p className="text-2xl font-script text-destructive font-bold">{eventDetails.family}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                  <Button onClick={addToCalendar} className="bg-primary hover:bg-primary/90">
                    <Calendar size={18} className="mr-2" />
                    Add to Calendar
                  </Button>
                  
                  <Button onClick={shareOnWhatsApp} className="bg-green-600 hover:bg-green-700">
                    <ChatCircle size={18} className="mr-2" />
                    Share on WhatsApp
                  </Button>
                  
                  <Button onClick={copyInvitationMessage} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                    <Copy size={18} className="mr-2" />
                    Copy Message
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

                {/* RSVP Status - Removed to keep attendance private */}
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
      )}
    </>
  )
}

export default App