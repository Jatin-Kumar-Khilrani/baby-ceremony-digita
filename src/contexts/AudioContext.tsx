import { createContext, useContext, useState, ReactNode } from 'react'

interface AudioContextType {
  isTTSPlaying: boolean
  setIsTTSPlaying: (playing: boolean) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isTTSPlaying, setIsTTSPlaying] = useState(false)

  return (
    <AudioContext.Provider value={{ isTTSPlaying, setIsTTSPlaying }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  // Return default values if not within AudioProvider (e.g., in Admin panel)
  if (!context) {
    return {
      isTTSPlaying: false,
      setIsTTSPlaying: () => {}, // No-op function
    }
  }
  return context
}
