import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { SpeakerHigh, SpeakerSlash, Play, Pause, MusicNotes } from '@phosphor-icons/react'
import { useAudio } from '@/contexts/AudioContext'
import { toast } from 'sonner'

interface BackgroundMusicPlayerProps {
  autoPlay?: boolean
  defaultVolume?: number
}

export function BackgroundMusicPlayer({ autoPlay = false, defaultVolume = 0.25 }: BackgroundMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hasAutoStarted, setHasAutoStarted] = useState(autoPlay)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volumeBeforeDuck = useRef<number>(defaultVolume)
  const wasPlayingBeforeTTS = useRef<boolean | null>(null) // Track state before TTS, null = no TTS active
  const userManuallyStopped = useRef<boolean>(false) // Track if user manually stopped music
  const ttsStopTimeout = useRef<NodeJS.Timeout | null>(null) // Debounce TTS stop to detect interruption
  const { isTTSPlaying } = useAudio() // Get TTS playing state from context

  // Free royalty-free peaceful instrumental music
  // These tracks are from various free music sources
  const musicTracks = [
    // Peaceful ambient instrumental - you can replace with your own hosted music
    // Options:
    // 1. Download from YouTube Audio Library (peaceful, ambient, instrumental)
    // 2. Use Pixabay Music (royalty-free)
    // 3. Use Incompetech (Kevin MacLeod - CC Attribution)
    // 4. Use Bensound (personal/commercial use allowed with attribution)
    
    // Example: Peaceful piano/ambient track
    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', // Peaceful ambient
  ]

  useEffect(() => {
    // Create audio element
    const audio = new Audio(musicTracks[0])
    audio.loop = true
    audio.volume = volume
    audioRef.current = audio

    // Smooth fade in when auto-play
    if (autoPlay) {
      audio.volume = 0
      const fadeIn = setInterval(() => {
        if (audio.volume < volume) {
          audio.volume = Math.min(audio.volume + 0.02, volume)
        } else {
          clearInterval(fadeIn)
        }
      }, 50)

      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Auto-play prevented by browser:', error)
          setIsPlaying(false)
          clearInterval(fadeIn)
        })
      }
    }

    return () => {
      audio.pause()
      audio.src = ''
      // Clean up any pending timeout
      if (ttsStopTimeout.current) {
        clearTimeout(ttsStopTimeout.current)
      }
    }
  }, [])

  // Auto-start music when user first clicks "Listen" (TTS plays)
  useEffect(() => {
    // Only auto-start if: TTS is playing, hasn't started before, not currently playing, and user hasn't manually stopped it
    if (isTTSPlaying && !hasAutoStarted && !isPlaying && !userManuallyStopped.current && audioRef.current) {
      console.log('Auto-starting background music on first TTS play')
      setHasAutoStarted(true)
      
      // Start music with fade in
      audioRef.current.volume = 0
      const playPromise = audioRef.current.play()
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true)
          toast.success('🎵 Background music started', {
            description: 'Music will auto-pause when TTS finishes. Use player to keep it playing.',
            duration: 3000
          })
          // Fade in to target volume
          const fadeIn = setInterval(() => {
            if (audioRef.current && audioRef.current.volume < volume) {
              audioRef.current.volume = Math.min(audioRef.current.volume + 0.05, volume)
            } else {
              clearInterval(fadeIn)
            }
          }, 30)
        }).catch(error => {
          console.log('Auto-play failed (browser restriction):', error)
          toast.info('🎵 Click the play button to enable background music', {
            description: 'Browser blocked auto-play. Click the music player in bottom-right corner.',
            duration: 5000
          })
        })
      }
    }
  }, [isTTSPlaying, hasAutoStarted, isPlaying, volume])

  // Handle ducking (lowering volume when TTS plays) and state management
  useEffect(() => {
    if (!audioRef.current) return

    if (isTTSPlaying) {
      // TTS is playing - clear any pending stop timeout (might be interruption)
      if (ttsStopTimeout.current) {
        console.log('TTS restarted before timeout - this is an interruption, not completion')
        clearTimeout(ttsStopTimeout.current)
        ttsStopTimeout.current = null
      }
      
      // TTS just started - save the current state ONCE (only if not already saved)
      if (wasPlayingBeforeTTS.current === undefined || wasPlayingBeforeTTS.current === null) {
        wasPlayingBeforeTTS.current = isPlaying
        console.log('TTS started, saving music state:', isPlaying ? 'playing' : 'paused')
      }
      
      if (isPlaying) {
        // Music is playing - duck the volume
        setIsTransitioning(true)
        volumeBeforeDuck.current = volume
        const targetVolume = isMuted ? 0 : volume * 0.2
        
        // Smooth transition down
        const duckInterval = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > targetVolume) {
            audioRef.current.volume = Math.max(audioRef.current.volume - 0.02, targetVolume)
          } else {
            clearInterval(duckInterval)
            setIsTransitioning(false)
          }
        }, 30)

        return () => clearInterval(duckInterval)
      }
      // If music was paused, do nothing - stay paused
      
    } else if (wasPlayingBeforeTTS.current !== undefined && wasPlayingBeforeTTS.current !== null) {
      // TTS stopped - but wait briefly to see if another TTS starts (interruption)
      console.log('TTS stopped - waiting 200ms to detect interruption vs completion')
      
      // Clear any existing timeout
      if (ttsStopTimeout.current) {
        clearTimeout(ttsStopTimeout.current)
      }
      
      // Set a timeout to handle TTS completion (only if not interrupted)
      ttsStopTimeout.current = setTimeout(() => {
        console.log('TTS finished (not interrupted), was playing before:', wasPlayingBeforeTTS.current, 'current state:', isPlaying, 'manually stopped:', userManuallyStopped.current)
        
        if (wasPlayingBeforeTTS.current) {
          // Music WAS playing before TTS - keep it playing and restore volume
          if (isPlaying && !userManuallyStopped.current) {
            // Still playing - just restore volume
            setIsTransitioning(true)
            const targetVolume = isMuted ? 0 : volumeBeforeDuck.current
            
            const restoreInterval = setInterval(() => {
              if (audioRef.current && audioRef.current.volume < targetVolume) {
                audioRef.current.volume = Math.min(audioRef.current.volume + 0.02, targetVolume)
              } else {
                clearInterval(restoreInterval)
                setIsTransitioning(false)
              }
            }, 30)
          } else if (userManuallyStopped.current) {
            // User manually stopped it during TTS - respect user's action
            console.log('User manually stopped during TTS, staying stopped')
          }
        } else {
          // Music was NOT playing before TTS (it was auto-started during TTS)
          // Pause it after TTS finishes (but allow subsequent TTS to auto-restart it)
          if (isPlaying && !userManuallyStopped.current) {
            console.log('Pausing auto-started music after TTS')
            const fadeOut = setInterval(() => {
              if (audioRef.current && audioRef.current.volume > 0.01) {
                audioRef.current.volume = Math.max(audioRef.current.volume - 0.05, 0)
              } else {
                clearInterval(fadeOut)
                audioRef.current?.pause()
                setIsPlaying(false)
                // Reset hasAutoStarted so next TTS can auto-start music again
                setHasAutoStarted(false)
                console.log('Reset hasAutoStarted - next TTS will auto-start music')
                // DON'T set userManuallyStopped - this is auto-pause, not manual
              }
            }, 30)
          }
        }
        
        // Reset the saved state for next TTS play
        wasPlayingBeforeTTS.current = null
        ttsStopTimeout.current = null
      }, 200) // 200ms debounce to detect interruption
    }
  }, [isTTSPlaying, isPlaying, volume, isMuted])

  useEffect(() => {
    if (audioRef.current && !isTransitioning) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted, isTransitioning])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      // User manually pausing
      console.log('User manually paused music')
      userManuallyStopped.current = true // Mark as manually stopped
      
      // Fade out before pausing
      const fadeOut = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.01) {
          audioRef.current.volume = Math.max(audioRef.current.volume - 0.05, 0)
        } else {
          clearInterval(fadeOut)
          audioRef.current?.pause()
        }
      }, 30)
      setIsPlaying(false)
    } else {
      // User manually starting
      console.log('User manually started music')
      userManuallyStopped.current = false // Clear the manual stop flag
      
      // Start with fade in
      audioRef.current.volume = 0
      audioRef.current.play().then(() => {
        const fadeIn = setInterval(() => {
          if (audioRef.current && audioRef.current.volume < volume) {
            audioRef.current.volume = Math.min(audioRef.current.volume + 0.05, volume)
          } else {
            clearInterval(fadeIn)
          }
        }, 30)
      }).catch(error => {
        console.error('Error playing music:', error)
      })
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0]
    setVolume(newVolume)
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-3 border border-gray-200 max-w-xs">
      <div className="flex items-center gap-2">
        {/* Music Icon */}
        <MusicNotes 
          className={`w-5 h-5 ${isPlaying ? 'text-primary animate-pulse' : 'text-gray-400'}`} 
          weight="fill" 
        />

        {/* Play/Pause Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          className="h-8 w-8 p-0"
          title={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" weight="fill" />
          ) : (
            <Play className="w-5 h-5" weight="fill" />
          )}
        </Button>

        {/* Mute Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="h-8 w-8 p-0"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <SpeakerSlash className="w-5 h-5" weight="fill" />
          ) : (
            <SpeakerHigh className="w-5 h-5" weight="fill" />
          )}
        </Button>

        {/* Volume Slider */}
        <div className="flex-1 min-w-[100px]">
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.01}
            className="cursor-pointer"
            disabled={isTransitioning}
          />
        </div>
      </div>

      {/* Track Info with ducking indicator */}
      <div className="mt-2 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
        {isTTSPlaying && isPlaying && (
          <span className="text-amber-500 font-semibold animate-pulse">🔉 Ducking</span>
        )}
        {!isTTSPlaying && (
          <span>🎵 Peaceful background music</span>
        )}
      </div>
    </div>
  )
}
