import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Heart, PaperPlaneTilt, Star, Sparkle, ArrowClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import { AudioRecorder } from '@/components/AudioRecorder'
import { TextToSpeech } from '@/components/TextToSpeech'
import { BackgroundMusicPlayer } from '@/components/BackgroundMusicPlayer'
import { AudioProvider } from '@/contexts/AudioContext'

interface Wish {
  id: string
  name: string
  message: string
  email?: string
  gender?: 'male' | 'female' | 'other'
  defaultGender?: 'male' | 'female' // Admin override for TTS
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

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:7071/api' : '/api')

export default function GuestWishes() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancedMessage, setEnhancedMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false)
  const [wishData, setWishData] = useState({
    name: '',
    email: '',
    message: '',
    gender: '' as 'male' | 'female' | 'other' | ''
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

  // Check if email has already submitted a wish
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) {
      setHasAlreadySubmitted(false)
      return
    }

    try {
      // Check against the backend to see if email exists
      const response = await fetch(`${API_BASE_URL}/wishes`)
      if (response.ok) {
        const allWishes = await response.json()
        const emailExists = Array.isArray(allWishes) && allWishes.some(
          (w: Wish) => w.email?.toLowerCase() === email.toLowerCase()
        )
        setHasAlreadySubmitted(emailExists)
        
        if (emailExists) {
          toast.warning('This email has already been used to submit a wish', {
            description: 'Each person can only submit one wish. Please use a different email if you want to submit another wish.'
          })
        }
      }
    } catch (error) {
      console.error('Error checking email:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!wishData.name) {
      toast.error('Please enter your name')
      return
    }

    // Allow audio-only OR text-only OR both
    if (!wishData.message && !audioUrl) {
      toast.error('Please either write a message or record an audio wish (or both!)')
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
          message: wishData.message,
          gender: wishData.gender || undefined,
          audioUrl: audioUrl,
          audioDuration: audioDuration,
          hasAudio: !!audioUrl
        })
      })

      if (response.ok) {
        const newWish = await response.json()
        // Don't add to local state immediately - will appear after admin approval
        
        toast.success('Thank you for your wishes! 🙏', {
          description: 'Your wish will appear after admin approval (usually within a few hours)'
        })
        
        // Mark wish as completed for attention guide
        localStorage.setItem('baby-ceremony-wish-completed', 'true')
        
        setWishData({
          name: '',
          email: '',
          message: '',
          gender: ''
        })
        setEnhancedMessage('')
        setAudioUrl(null)
        setAudioDuration(null)
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

  const handleAudioRecorded = (url: string, duration: number) => {
    setAudioUrl(url)
    setAudioDuration(duration)
    toast.success('Audio recorded successfully!')
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

  // Filter wishes based on search query and approval status
  const filteredWishes = wishes.filter(wish => {
    // Only show approved wishes to public (undefined means legacy data, show it)
    if (wish.approved === false) return false
    
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      wish.name.toLowerCase().includes(query) ||
      wish.message.toLowerCase().includes(query)
    )
  })

  return (
    <AudioProvider>
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
          {/* Mobile Compatibility Info */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              📱 <strong>Mobile Users:</strong> Audio recording works on Chrome Android, Safari iOS (14.3+), and Samsung Internet. 
              Text-to-speech works on most mobile browsers!
            </p>
          </div>
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
                onChange={(e) => {
                  setWishData(prev => ({ ...prev, email: e.target.value }))
                  // Check if email already exists when user finishes typing
                  const email = e.target.value
                  if (email.includes('@') && email.includes('.')) {
                    checkEmailExists(email)
                  } else {
                    setHasAlreadySubmitted(false)
                  }
                }}
                onBlur={(e) => checkEmailExists(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Required to prevent duplicate wishes. One wish per person.
              </p>
              {hasAlreadySubmitted && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ This email has already been used to submit a wish
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Each person can submit only one wish. If you need to update your wish, please contact the admin.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wish-gender">Gender (Optional - for voice selection)</Label>
              <select
                id="wish-gender"
                value={wishData.gender}
                onChange={(e) => setWishData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' | '' }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Select your gender for voice selection"
                disabled={hasAlreadySubmitted}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <p className="text-xs text-muted-foreground">
                🎭 Helps us select the right voice (male/female) when reading your wish aloud
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="wish-message">Your Wishes & Blessings (Optional if recording audio)</Label>
              <Textarea
                id="wish-message"
                value={wishData.message}
                onChange={(e) => setWishData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Share your heartfelt wishes, blessings, and hopes for baby Parv's bright future..."
                rows={4}
                disabled={hasAlreadySubmitted}
              />
              <p className="text-xs text-muted-foreground">
                💬 Supports: English, Hindi (हिंदी), Marwadi, Rajasthani, Sindhi (in English or سنڌي)<br />
                ✨ You can write text, record audio, or do both!
              </p>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !wishData.email || !wishData.message || wishData.message.length < 5 || hasAlreadySubmitted}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Sparkle size={16} className="mr-2" />
                  {isEnhancing ? 'Enhancing...' : 'Enhance with AI ✨'}
                </Button>
              </div>
            </div>

            {/* Audio Recording */}
            <div className="space-y-2">
              <Label htmlFor="wish-audio">🎙️ Or Record an Audio Wish (Optional)</Label>
              {hasAlreadySubmitted ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm text-gray-600">
                    🚫 Audio recording is disabled because this email has already submitted a wish
                  </p>
                </div>
              ) : (
                <AudioRecorder 
                  onAudioRecorded={handleAudioRecorded}
                  maxDuration={180}
                />
              )}
              {audioUrl && audioDuration && (
                <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">🎙️</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-900">Audio Recorded Successfully!</p>
                        <p className="text-xs text-green-700">
                          Duration: {Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAudioUrl(null)
                        setAudioDuration(null)
                        toast.info('Audio removed. You can record again if needed.')
                      }}
                      className="text-green-700 hover:text-green-900 hover:bg-green-100"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  {/* Audio Preview with Volume Control */}
                  <div className="space-y-2 pt-2 border-t border-green-200">
                    <Label className="text-sm text-green-900">Preview & Adjust Volume:</Label>
                    <audio 
                      src={audioUrl} 
                      controls 
                      className="w-full"
                      preload="metadata"
                    />
                    <p className="text-xs text-green-600 italic">
                      🔊 Use the volume control in the player to test and adjust playback volume
                    </p>
                  </div>
                  
                  <p className="text-xs text-green-600 italic">
                    ✅ Your audio will be included when you submit the wish
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                💡 You can record audio, write text, or both! Max 3 minutes.
              </p>
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

            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
              disabled={isSubmitting || hasAlreadySubmitted}
            >
              <PaperPlaneTilt size={18} className="mr-2" />
              {hasAlreadySubmitted ? 'Already Submitted' : isSubmitting ? 'Sending...' : 'Send Wishes'}
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
                      {wish.hasAudio && (
                        <Badge variant="secondary" className="text-xs">
                          🎙️ Audio
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(wish.timestamp)}
                    </span>
                  </div>
                  
                  {/* Text Message */}
                  {wish.message && (
                    <div className="space-y-2">
                      <p className="text-foreground leading-relaxed italic">
                        "{wish.message}"
                      </p>
                      {/* TTS for text (even if has audio) */}
                      <TextToSpeech 
                        text={wish.message} 
                        senderName={wish.name}
                        senderGender={wish.defaultGender || wish.gender} // Admin override takes precedence
                        showVoiceSelector={true}
                      />
                    </div>
                  )}
                  
                  {/* Audio Player (can coexist with text) */}
                  {wish.hasAudio && wish.audioUrl && (
                    <div className={`${wish.message ? 'mt-4' : 'mt-2'} space-y-2 bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200`}>
                      <p className="text-xs font-semibold text-purple-700 mb-2">
                        🎙️ Audio Recording
                        {wish.audioDuration && ` (${Math.floor(wish.audioDuration / 60)}:${(wish.audioDuration % 60).toString().padStart(2, '0')})`}
                      </p>
                      <audio 
                        src={wish.audioUrl} 
                        controls 
                        className="w-full"
                        preload="metadata"
                      />
                      {wish.message && (
                        <p className="text-xs text-muted-foreground italic">
                          💝 This wish includes both text and audio message!
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Audio-only indicator */}
                  {!wish.message && wish.hasAudio && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      🎙️ Audio-only wish
                    </p>
                  )}
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

      {/* Background Music Player */}
      <BackgroundMusicPlayer autoPlay={false} defaultVolume={0.25} />
      </div>
    </AudioProvider>
  )
}