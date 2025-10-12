import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Sparkle } from '@phosphor-icons/react'

interface WelcomeScreenProps {
  onContinue: () => void
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/20 animate-gradient"></div>
      
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-36 h-36 bg-pink-200/20 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <Card className="max-w-2xl w-full border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-xl relative z-10 transform hover:scale-[1.02] transition-transform duration-500">
        <CardContent className="p-0">
          {/* Hero Section - Image with Overlapping Text */}
          <div className="relative bg-gradient-to-br from-blue-50 via-blue-100/50 to-purple-50/30 overflow-hidden">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
            
            {/* Ganesh Ji Image - At the very top, separate from moon image */}
            <div className="relative pt-6 pb-4 flex justify-center z-30">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-2xl border-2 border-orange-400/60 animate-in fade-in zoom-in duration-700">
                <img 
                  src="/ganesh.png" 
                  alt="Ganesh Ji"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
                />
              </div>
            </div>
            
            {/* Image Container - Cropped to show baby & moon */}
            <div className="relative h-[340px] md:h-[400px] overflow-hidden">
              {/* Image with blend wrapper */}
              <div className="relative w-full h-full">
                <img 
                  src="/baby-moon-bg.png" 
                  alt="Baby Welcome Ceremony"
                  className="w-full h-auto max-w-lg mx-auto animate-in zoom-in duration-700 filter drop-shadow-2xl scale-125 hero-baby-moon"
                />
                
                {/* Soft edge blending - radial fade from center */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-blue-50 opacity-60 pointer-events-none"></div>
              </div>
              
              {/* Sparkle effects around baby & moon */}
              <div className="absolute top-6 left-8 md:left-16 animate-ping-slow z-10">
                <Sparkle size={28} className="text-yellow-400/90" weight="fill" />
              </div>
              <div className="absolute top-16 right-12 md:right-20 animate-ping-slow delay-1000 z-10">
                <Sparkle size={22} className="text-blue-400/90" weight="fill" />
              </div>
              <div className="absolute top-32 left-16 md:left-24 animate-ping-slow delay-2000 z-10">
                <Sparkle size={24} className="text-pink-400/90" weight="fill" />
              </div>
              
              {/* Gradient overlay - soft fade from transparent to white at bottom */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none"></div>
            </div>
            
            {/* Overlapping Content - Starts from middle of image */}
            <div className="relative -mt-32 z-20 text-center px-4 pb-8 space-y-4">
              {/* Sparkle icon badge - floating */}
              <div className="inline-flex justify-center mb-2 animate-bounce">
                <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full p-3.5 shadow-2xl border-4 border-white/90">
                  <Sparkle size={32} className="text-white" weight="fill" />
                </div>
              </div>
              
              {/* Title - Overlapping from below moon */}
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent filter drop-shadow-lg leading-tight px-4">
                  Baby Welcome
                  <br />
                  Ceremony
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                  <Sparkle size={16} className="text-purple-500" weight="fill" />
                  <div className="h-0.5 w-16 bg-gradient-to-l from-transparent via-purple-500 to-transparent"></div>
                </div>
              </div>
              
              {/* Welcome badge - with strong backdrop blur */}
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/95 backdrop-blur-lg rounded-full border-2 border-blue-300/70 shadow-2xl animate-in fade-in duration-700 delay-200">
                <span className="text-2xl">🎉</span>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Welcome!</span>
                <span className="text-2xl">🎉</span>
              </div>
              
              {/* Subtitle card - Clean white card */}
              <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl border-2 border-white/80 animate-in fade-in duration-700 delay-300">
                <p className="text-xl md:text-2xl text-gray-800 leading-relaxed font-semibold mb-3">
                  You're invited to celebrate the arrival of our precious little one!
                </p>
                <p className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ✨ Join us in this joyous occasion ✨
                </p>
              </div>
            </div>
            
            {/* Smooth gradient transition */}
            <div className="h-8 bg-gradient-to-b from-blue-50/20 to-white"></div>
          </div>
          
          {/* Bottom Content Section - Clean white background */}
          <div className="bg-white px-6 md:px-12 py-8 text-center space-y-5">
            {/* Info box */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3.5 border border-amber-200/50 shadow-sm animate-in fade-in duration-700 delay-400">
              <p className="text-sm text-gray-700 flex items-center justify-center gap-2">
                <span className="text-xl">💡</span>
                <span><span className="font-semibold">First time here?</span> We'll guide you through every step!</span>
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="animate-in fade-in duration-700 delay-500">
              <Button 
                size="lg" 
                className="w-full md:w-auto text-lg py-6 px-10 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group border-0"
                onClick={onContinue}
              >
                <span className="font-semibold">View Invitation</span>
                <ArrowRight 
                  size={22} 
                  className="ml-2 group-hover:translate-x-2 transition-transform duration-300" 
                  weight="bold"
                />
              </Button>
            </div>
            
            {/* Features */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm animate-in fade-in duration-700 delay-600">
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="text-lg">💌</span>
                <span>RSVP</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="text-lg">💝</span>
                <span>Wishes</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="text-lg">📸</span>
                <span>Photos</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="text-lg">🎊</span>
                <span>Celebration</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
