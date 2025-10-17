import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Heart, PaperPlaneTilt, Star, Sparkle, ArrowClockwise, MagnifyingGlass } from '@phosphor-icons/react'

interface Wish {
  id: string
  name: string
  message: string
  email?: string
  timestamp: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:7071/api' : '/api')

export default function GuestWishes() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedMessage, setEnhancedMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [wishData, setWishData] = useState({
    name: '',
    email: '',
    message: ''
  })

  // Fetch wishes from backend
  useEffect(() => {
    const fetchWishes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/wishes`)
        if (response.ok) {
          const data = await response.json()
          // Ensure data is always an array
          setWishes(Array.isArray(data) ? data : [])
        } else {
          setWishes([])
        }
      } catch (error) {
        console.error('Failed to fetch wishes:', error)
        setWishes([])
        toast.error('Failed to load wishes')
      } finally {
        setIsLoading(false)
      }
    }
    fetchWishes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!wishData.name || !wishData.message) {
      toast.error('Please fill in both name and message')
      return
    }

    if (!wishData.email) {
      toast.error('Please provide your email to prevent duplicate wishes')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/wishes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: wishData.name,
          email: wishData.email,
          message: wishData.message
        })
      })

      if (response.ok) {
        const newWish = await response.json()
        setWishes(prev => [...(Array.isArray(prev) ? prev : []), newWish])
        
        toast.success('Thank you for your beautiful wishes!')
        
        setWishData({
          name: '',
          email: '',
          message: ''
        })
        setEnhancedMessage('')
      } else if (response.status === 409) {
        const data = await response.json()
        toast.error(data.error || 'You have already submitted a wish')
      } else {
        toast.error('Failed to submit wish')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit wish')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnhance = async () => {
    if (!wishData.message || wishData.message.trim().length < 5) {
      toast.error('Please write a wish first (at least 5 characters)')
      return
    }

    if (!wishData.email || !wishData.email.trim()) {
      toast.error('Please enter your email first to prevent duplicate wishes')
      return
    }

    setIsEnhancing(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/enhance-wish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: wishData.message })
      })

      if (response.ok) {
        const { enhanced } = await response.json()
        setEnhancedMessage(enhanced)
        toast.success('✨ Wish enhanced! Review and use if you like it.')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to enhance wish')
      }
    } catch (error) {
      console.error('Enhancement error:', error)
      toast.error('Failed to enhance wish. Please try again.')
    } finally {
      setIsEnhancing(false)
    }
  }

  const useEnhanced = () => {
    setWishData(prev => ({ ...prev, message: enhancedMessage }))
    setEnhancedMessage('')
    toast.success('Enhanced wish applied!')
  }

  const resetEnhanced = () => {
    setEnhancedMessage('')
  }

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp || isNaN(timestamp)) {
      return 'Recently'
    }
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Recently'
    }
  }

  // Filter wishes based on search query
  const filteredWishes = wishes.filter(wish => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      wish.name.toLowerCase().includes(query) ||
      wish.message.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      {/* Add Wish Form */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-script text-primary flex items-center justify-center gap-2">
            <Heart size={24} className="text-accent" />
            Share Your Blessings
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Leave your heartfelt wishes for baby Parv and his family
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wish-name">Your Name *</Label>
              <Input
                id="wish-name"
                value={wishData.name}
                onChange={(e) => setWishData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wish-email">Your Email *</Label>
              <Input
                id="wish-email"
                type="email"
                value={wishData.email}
                onChange={(e) => setWishData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Required to prevent duplicate wishes. One wish per person.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wish-message">Your Wishes & Blessings *</Label>
              <Textarea
                id="wish-message"
                value={wishData.message}
                onChange={(e) => setWishData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Share your heartfelt wishes, blessings, and hopes for baby Parv's bright future..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                💬 Supports: English, Hindi (हिंदी), Marwadi, Rajasthani, Sindhi (in English or سنڌي)
              </p>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !wishData.email || !wishData.message || wishData.message.length < 5}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Sparkle size={16} className="mr-2" />
                  {isEnhancing ? 'Enhancing...' : 'Enhance with AI ✨'}
                </Button>
              </div>
            </div>

            {enhancedMessage && (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Sparkle size={20} className="text-purple-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <Label className="text-purple-900 font-semibold">AI Enhanced Version:</Label>
                      <p className="mt-2 text-sm text-purple-800 leading-relaxed italic">
                        "{enhancedMessage}"
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="button"
                      size="sm" 
                      onClick={useEnhanced}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Use This Version
                    </Button>
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline" 
                      onClick={resetEnhanced}
                    >
                      <ArrowClockwise size={16} className="mr-1" />
                      Keep Original
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              <PaperPlaneTilt size={18} className="mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Wishes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Wishes Display */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-primary">
            Wishes & Blessings ({wishes?.length || 0})
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search wishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Badge variant="secondary" className="text-sm whitespace-nowrap">
              <Star size={14} className="mr-1" />
              {filteredWishes.length} {filteredWishes.length === 1 ? 'Wish' : 'Wishes'}
            </Badge>
          </div>
        </div>

        {filteredWishes && filteredWishes.length > 0 ? (
          <div className="space-y-4">
            {filteredWishes.slice().reverse().map((wish, index) => (
              <Card key={wish.id || `wish-${index}`} className="bg-gradient-to-r from-muted/30 to-accent/10 border-accent/20">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-accent mt-1" />
                      <span className="font-medium text-primary">{wish.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(wish.timestamp)}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed italic">
                    "{wish.message}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Heart size={48} className="text-muted-foreground/50 mb-4" />
              <h4 className="text-lg font-medium text-muted-foreground mb-2">
                {searchQuery ? 'No wishes found' : 'No wishes yet'}
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery 
                  ? `No wishes match "${searchQuery}". Try a different search term.`
                  : "Be the first to share your blessings and wishes for baby Parv's wonderful journey ahead!"
                }
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sample Wishes Ideas */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Need inspiration?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Here are some beautiful blessing ideas in different languages:
          </p>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-xs text-muted-foreground">English:</p>
              <div className="italic text-foreground/80 pl-3 border-l-2 border-purple-300">
                "May baby Parv be blessed with health, happiness, and endless love. Wishing this precious little one a life filled with joy and wonderful adventures."
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-xs text-muted-foreground">Hindi (हिंदी):</p>
              <div className="italic text-foreground/80 pl-3 border-l-2 border-blue-300">
                "नन्हे पर्व को स्वास्थ्य, खुशी और अनंत प्यार का आशीर्वाद मिले। इस प्यारे बच्चे को जीवन में खुशियों और सफलता की कामना करते हैं।"
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-xs text-muted-foreground">Rajasthani (राजस्थानी):</p>
              <div className="italic text-foreground/80 pl-3 border-l-2 border-orange-300">
                "नानो पर्व नै सगळी खुशियां अर आशीर्वाद मिलै। थारो बेटो जीवन में सदा सुखी अर सफळ रहवै।"
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-xs text-muted-foreground">Sindhi (Roman/English):</p>
              <div className="italic text-foreground/80 pl-3 border-l-2 border-green-300">
                "Nanho Parv ne ghani ghani mubarak. Tuhinjo jiwan khushiyon saan bhariyo hove ۽ sada sukhi raho."
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            ✨ AI will enhance your wish in whichever language you write!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}