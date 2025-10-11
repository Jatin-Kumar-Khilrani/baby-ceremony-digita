import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Sparkle } from '@phosphor-icons/react'

interface WelcomeScreenProps {
  onContinue: () => void
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-pink-50 to-blue-50 animate-in fade-in duration-1000">
      <Card className="max-w-2xl w-full border-2 border-primary/20 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Welcome Image */}
          <div className="relative">
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Crect fill='%23fef3e2' width='1200' height='800'/%3E%3Ctext x='50%25' y='30%25' font-family='cursive' font-size='120' fill='%23a0826d' text-anchor='middle'%3EBaby%3C/text%3E%3Ctext x='50%25' y='45%25' font-family='cursive' font-size='120' fill='%23a0826d' text-anchor='middle'%3Ewelcome%3C/text%3E%3Ctext x='50%25' y='85%25' font-family='serif' font-size='40' fill='%23a0826d' text-anchor='middle' opacity='0.7'%3EThe Retreat for a Closer Pearl%3C/text%3E%3C/svg%3E"
              alt="Baby Welcome"
              className="w-full h-auto animate-in zoom-in duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>
          
          {/* Welcome Content */}
          <div className="p-8 text-center space-y-6 relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2">
              <div className="bg-white rounded-full p-4 shadow-lg animate-bounce">
                <Sparkle size={32} className="text-accent" weight="fill" />
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-script text-primary font-bold mt-4">
              Welcome! 🎉
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              You're invited to celebrate the arrival of our precious little one!
              <br />
              <span className="font-semibold text-primary">Join us in this joyous occasion</span>
            </p>
            
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
              <p className="text-sm text-muted-foreground">
                💡 <span className="font-semibold">First time here?</span> We'll guide you through!
              </p>
            </div>
            
            <Button 
              size="lg" 
              className="w-full md:w-auto text-lg py-6 px-8 group"
              onClick={onContinue}
            >
              View Invitation
              <ArrowRight 
                size={20} 
                className="ml-2 group-hover:translate-x-1 transition-transform" 
              />
            </Button>
            
            <p className="text-xs text-muted-foreground">
              💌 RSVP • 💝 Wishes • 📸 Photos • 🎊 Celebration
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
