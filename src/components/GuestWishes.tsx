import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Heart, PaperPlaneTilt, Star } from '@phosphor-icons/react'

interface Wish {
  id: string
  name: string
  message: string
  timestamp: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:7071/api' : '/api')

export default function GuestWishes() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wishData, setWishData] = useState({
    name: '',
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

    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/wishes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: wishData.name,
          message: wishData.message
        })
      })

      if (response.ok) {
        const newWish = await response.json()
        setWishes(prev => [...(Array.isArray(prev) ? prev : []), newWish])
        
        toast.success('Thank you for your beautiful wishes!')
        
        setWishData({
          name: '',
          message: ''
        })
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
              <Label htmlFor="wish-name">Your Name</Label>
              <Input
                id="wish-name"
                value={wishData.name}
                onChange={(e) => setWishData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wish-message">Your Wishes & Blessings</Label>
              <Textarea
                id="wish-message"
                value={wishData.message}
                onChange={(e) => setWishData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Share your heartfelt wishes, blessings, and hopes for baby Parv's bright future..."
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
              <PaperPlaneTilt size={18} className="mr-2" />
              {isSubmitting ? 'Sending...' : 'Send Wishes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Wishes Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-primary">
            Wishes & Blessings ({wishes?.length || 0})
          </h3>
          <Badge variant="secondary" className="text-sm">
            <Star size={14} className="mr-1" />
            Memories Being Made
          </Badge>
        </div>

        {wishes && wishes.length > 0 ? (
          <div className="space-y-4">
            {wishes.slice().reverse().map((wish, index) => (
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
                No wishes yet
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                Be the first to share your blessings and wishes for baby Parv's wonderful journey ahead!
              </p>
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
            Here are some beautiful blessing ideas to get you started:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="italic text-foreground/80">
              "May baby Parv be blessed with health, happiness, and endless love..."
            </div>
            <div className="italic text-foreground/80">
              "Wishing little Parv a life filled with joy, laughter, and wonderful adventures..."
            </div>
            <div className="italic text-foreground/80">
              "May this precious little one bring immense joy to your family..."
            </div>
            <div className="italic text-foreground/80">
              "Congratulations on your beautiful blessing. May Parv grow up strong and wise..."
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}