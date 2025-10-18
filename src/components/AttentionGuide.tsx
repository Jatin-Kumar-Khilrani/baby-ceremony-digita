import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Users, X } from '@phosphor-icons/react'

interface AttentionGuideProps {
  currentTab: string
  onNavigate: (tab: string) => void
}

export default function AttentionGuide({ currentTab, onNavigate }: AttentionGuideProps) {
  const [showReminder, setShowReminder] = useState(false)
  const [hasRSVPd, setHasRSVPd] = useState(false)
  const [hasWished, setHasWished] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  useEffect(() => {
    // Check if user has completed actions
    const rsvpCompleted = localStorage.getItem('baby-ceremony-rsvp-completed')
    const wishCompleted = localStorage.getItem('baby-ceremony-wish-completed')
    const guideDismissed = sessionStorage.getItem('baby-ceremony-guide-dismissed')
    
    setHasRSVPd(!!rsvpCompleted)
    setHasWished(!!wishCompleted)
    setDismissed(!!guideDismissed)
  }, [])

  useEffect(() => {
    // Only track scroll on invitation tab
    if (currentTab !== 'invitation') {
      setHasScrolledToBottom(false)
      return
    }

    const handleScroll = () => {
      // Check if user has scrolled near bottom of page
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      
      // Consider "bottom" when user is within 200px of actual bottom
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)
      
      if (distanceFromBottom < 200 && !hasScrolledToBottom) {
        setHasScrolledToBottom(true)
        
        // Show reminder after a short delay once they reach bottom
        const guideDismissed = sessionStorage.getItem('baby-ceremony-guide-dismissed')
        const rsvpCompleted = localStorage.getItem('baby-ceremony-rsvp-completed')
        const wishCompleted = localStorage.getItem('baby-ceremony-wish-completed')
        
        if (!guideDismissed && (!rsvpCompleted || !wishCompleted)) {
          setTimeout(() => {
            setShowReminder(true)
          }, 1000) // 1 second after reaching bottom
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    // Check immediately in case already scrolled
    handleScroll()
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentTab, hasScrolledToBottom])

  const handleDismiss = () => {
    setShowReminder(false)
    setDismissed(true)
    sessionStorage.setItem('baby-ceremony-guide-dismissed', 'true')
  }

  const handleNavigate = (tab: string) => {
    setShowReminder(false)
    onNavigate(tab)
  }

  // Determine if we should show the floating reminder popup
  const shouldShowPopup = showReminder && 
                          currentTab === 'invitation' && 
                          !dismissed && 
                          !(hasRSVPd && hasWished)

  return (
    <>
      {/* Floating reminder badge - only show when conditions are met */}
      {shouldShowPopup && (
        <div className="attention-guide-popup fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl p-4 max-w-md mx-4 border-2 border-white/30 backdrop-blur-sm">
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 bg-white text-gray-700 rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Dismiss reminder"
            >
            <X size={16} weight="bold" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <span className="text-2xl animate-bounce">👋</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm mb-2">Don't miss out!</p>
              <p className="text-xs mb-3 opacity-95">
                Make your presence count - RSVP and share your wishes for baby {' '}
                <span className="font-bold">PARV</span>
              </p>
              
              <div className="flex flex-wrap gap-2">
                {!hasRSVPd && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 bg-white text-purple-700 hover:bg-gray-100 font-semibold text-xs gap-1.5"
                    onClick={() => handleNavigate('rsvp')}
                  >
                    <Users size={16} weight="fill" />
                    RSVP
                  </Button>
                )}
                {!hasWished && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 bg-white text-pink-700 hover:bg-gray-100 font-semibold text-xs gap-1.5"
                    onClick={() => handleNavigate('wishes')}
                  >
                    <Heart size={16} weight="fill" />
                    Wish
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Pulsing indicator on tabs */}
      <style>{`
        .attention-guide-popup {
          animation: slideInFromBottom 0.5s ease-out;
        }
        
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        [data-tour="rsvp"], [data-tour="wishes"] {
          position: relative;
        }
        
        ${!hasRSVPd ? `
        [data-tour="rsvp"]::after {
          content: '';
          position: absolute;
          top: -4px;
          right: -4px;
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
          box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
        }
        ` : ''}
        
        ${!hasWished ? `
        [data-tour="wishes"]::after {
          content: '';
          position: absolute;
          top: -4px;
          right: -4px;
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, #ec4899, #f43f5e);
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite 0.3s;
          box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7);
        }
        ` : ''}
        
        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
        }
        
        /* Gentle glow on hover */
        [data-tour="rsvp"]:hover, [data-tour="wishes"]:hover {
          animation: gentle-glow 1.5s ease-in-out infinite;
        }
        
        @keyframes gentle-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.6);
          }
        }
      `}</style>
    </>
  )
}
