import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, ArrowLeft } from '@phosphor-icons/react'

interface TourStep {
  target: string
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    target: '[data-tour="invitation"]',
    title: '📱 Invitation',
    content: 'View the beautiful invitation card with all ceremony details and baby\'s name.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="rsvp"]',
    title: '✉️ RSVP',
    content: 'Let us know if you\'re attending! Enter your details and get a PIN for managing your RSVP.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="wishes"]',
    title: '💝 Wishes',
    content: 'Share your heartfelt wishes and blessings for the little one.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="photos"]',
    title: '📸 Photos',
    content: 'Upload and view photos from the celebration. Share your memories!',
    placement: 'bottom'
  }
]

export default function TourGuide() {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTour, setHasSeenTour] = useState(false)

  useEffect(() => {
    const tourCompleted = localStorage.getItem('baby-ceremony-tour-completed')
    if (!tourCompleted) {
      // Start tour after a brief delay
      setTimeout(() => setIsActive(true), 1000)
    } else {
      setHasSeenTour(true)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTour = () => {
    localStorage.setItem('baby-ceremony-tour-completed', 'true')
    setIsActive(false)
    setHasSeenTour(true)
  }

  const skipTour = () => {
    completeTour()
  }

  if (!isActive || hasSeenTour) return null

  const step = tourSteps[currentStep]
  const target = document.querySelector(step.target)
  const rect = target?.getBoundingClientRect()

  if (!rect) return null

  const getPosition = () => {
    const offset = 10
    switch (step.placement) {
      case 'bottom':
        return { top: rect.bottom + offset, left: rect.left + rect.width / 2 - 150 }
      case 'top':
        return { top: rect.top - 200 - offset, left: rect.left + rect.width / 2 - 150 }
      case 'left':
        return { top: rect.top, left: rect.left - 310 }
      case 'right':
        return { top: rect.top, left: rect.right + offset }
      default:
        return { top: rect.bottom + offset, left: rect.left }
    }
  }

  const position = getPosition()

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={skipTour} />
      
      {/* Spotlight */}
      <div 
        className="fixed z-[101] pointer-events-none"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          border: '2px solid #f97316',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      
      {/* Tour Card */}
      <Card 
        className="fixed z-[102] w-[300px] shadow-2xl animate-in fade-in slide-in-from-bottom-4"
        style={{
          top: `${position.top}px`,
          left: `${Math.max(10, Math.min(position.left, window.innerWidth - 310))}px`
        }}
      >
        <CardContent className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-primary">{step.title}</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={skipTour}>
              <X size={16} />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">{step.content}</p>
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {tourSteps.length}
            </span>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ArrowLeft size={16} className="mr-1" />
                  Back
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep < tourSteps.length - 1 && <ArrowRight size={16} className="ml-1" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
