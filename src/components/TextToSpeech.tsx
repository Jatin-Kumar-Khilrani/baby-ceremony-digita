import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAudio } from '@/contexts/AudioContext';

interface TextToSpeechProps {
  text: string;
  language?: string; // 'en-US', 'hi-IN', etc.
  className?: string;
  senderName?: string; // Optional: to auto-detect gender
  senderGender?: 'male' | 'female' | 'other'; // Preferred: actual gender from form
  showVoiceSelector?: boolean; // Show dropdown to select voice
}

export function TextToSpeech({ 
  text, 
  language = 'auto', 
  className, 
  senderName,
  senderGender,
  showVoiceSelector = true 
}: TextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoiceType, setSelectedVoiceType] = useState<'male' | 'female' | 'auto'>('auto');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isManuallyStopped, setIsManuallyStopped] = useState(false);
  const { setIsTTSPlaying } = useAudio();

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Log voice count (not all voices to avoid console clutter)
      if (voices.length > 0) {
        console.log(`Loaded ${voices.length} TTS voices`);
      }
    };

    // Check mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('Mobile device detected - TTS should work on iOS Safari and Chrome Android');
    }

    loadVoices();
    
    // Chrome needs this event listener
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Detect gender from name (simple heuristic)
  const detectGenderFromName = (name: string): 'male' | 'female' => {
    const nameLower = name.toLowerCase().trim();
    
    // Common Indian female name endings
    const femaleIndicators = ['a', 'i', 'ee', 'ita', 'ika', 'ini', 'rani', 'devi', 'kumari', 'priya', 'lata', 'mala'];
    // Common male names patterns
    const maleNames = ['kumar', 'raj', 'dev', 'singh', 'khan', 'sharma', 'patel', 'gupta'];
    
    // Check female indicators
    for (const indicator of femaleIndicators) {
      if (nameLower.endsWith(indicator)) {
        return 'female';
      }
    }
    
    // Check male names
    for (const male of maleNames) {
      if (nameLower.includes(male)) {
        return 'male';
      }
    }
    
    // Default to female for names ending in 'a', male otherwise
    return nameLower.endsWith('a') ? 'female' : 'male';
  };

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Text-to-speech is not supported in your browser', {
        description: 'Please use Chrome, Safari, or Samsung Internet'
      });
      return;
    }

    // Check if voices are available
    const checkVoices = window.speechSynthesis.getVoices();
    if (checkVoices.length === 0) {
      toast.info('Loading voices... Please wait a moment and try again', {
        description: 'First time may take a few seconds'
      });
    }

    // Stop if already speaking
    if (isSpeaking) {
      setIsManuallyStopped(true); // Mark as manually stopped
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsTTSPlaying(false);
      return;
    }

    // Reset manual stop flag when starting new speech
    setIsManuallyStopped(false);
    
    // Cancel any pending speech
    window.speechSynthesis.cancel();

    setIsLoading(true);

    // Wait for voices to load
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Voices not loaded yet, wait a bit
      setTimeout(() => {
        speakNow();
      }, 100);
    } else {
      speakNow();
    }
  };

  const speakNow = () => {
    // Detect language from text if not provided
    let voiceLang = language;
    if (!language || language === 'auto') {
      // Simple language detection
      const hasHindi = /[\u0900-\u097F]/.test(text);
      const hasSindhi = /[\u0900-\u097F]/.test(text); // Sindhi uses Devanagari
      
      if (hasHindi || hasSindhi) {
        voiceLang = 'hi-IN';
      } else {
        voiceLang = 'en-IN'; // Prefer Indian English over US English
      }
    }

    // Split long text into chunks (TTS fails on very long text)
    // Use Array.from() to handle emojis correctly (multi-byte Unicode characters)
    const maxLength = 500; // Characters per chunk
    const textChunks: string[] = [];
    let currentChunk = '';
    
    // Better sentence splitting that preserves emojis
    // Split by periods, exclamation marks, or question marks followed by space or end
    const sentences = text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || [text];
    
    for (const sentence of sentences) {
      const combinedLength = Array.from(currentChunk + sentence).length; // Count actual characters including emojis
      
      if (combinedLength > maxLength && currentChunk) {
        // Current chunk is full, save it and start new chunk
        textChunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      textChunks.push(currentChunk.trim());
    }

    // Log only if multiple chunks (reduce console clutter)
    if (textChunks.length > 1) {
      console.log(`Text split into ${textChunks.length} chunks for TTS`);
    }

    // Function to speak a chunk
    let currentChunkIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const speakChunk = (chunkIndex: number) => {
      if (chunkIndex >= textChunks.length) {
        // All chunks spoken
        setIsSpeaking(false);
        setIsTTSPlaying(false);
        console.log('All speech chunks completed');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textChunks[chunkIndex]);
      utterance.lang = voiceLang;
      utterance.rate = 0.9; // Slightly slower for better clarity
      utterance.volume = 1.0;

      // Determine gender preference (priority: user selection > form data > name detection)
      let genderPreference: 'male' | 'female';
      
      if (selectedVoiceType !== 'auto') {
        // User manually selected voice type (highest priority)
        genderPreference = selectedVoiceType;
      } else if (senderGender && senderGender !== 'other') {
        // Use gender from form (second priority)
        genderPreference = senderGender;
      } else if (senderName) {
        // Fallback to name-based detection (third priority)
        genderPreference = detectGenderFromName(senderName);
      } else {
        // Final fallback when no information available
        genderPreference = 'female';
      }

      // Set pitch based on gender
      utterance.pitch = genderPreference === 'female' ? 1.1 : 0.9;

      // Try to find a suitable voice matching gender preference
      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      
      console.log(`Looking for ${genderPreference} voice in ${voices.length} available voices`);
      
      // **PRIORITY 1: Indian voices (hi-IN, en-IN)**
      const indianVoices = voices.filter(voice => 
        voice.lang === 'hi-IN' || voice.lang === 'en-IN' ||
        voice.lang.startsWith('hi-') || voice.name.toLowerCase().includes('india')
      );

      // **PRIORITY 2: Filter by language (prefer Hindi for Hindi text)**
      const languageVoices = voices.filter(voice => 
        voice.lang.startsWith(voiceLang.split('-')[0]) || voice.lang === voiceLang
      );

      // Combine: Prefer Indian voices, then language-matched voices
      const voicePool = indianVoices.length > 0 ? indianVoices : languageVoices;

      // **PRIORITY 3: Match gender**
      // Indian female voice names: Heera, Nisha, Lekha (Microsoft), Kalpana (Google)
      // Indian male voice names: Rishi, Sharad, Hemant (Microsoft), Prabhat (Google)
      let preferredVoice = voicePool.find(voice => {
        const voiceNameLower = voice.name.toLowerCase();
        if (genderPreference === 'female') {
          return voiceNameLower.includes('female') || voiceNameLower.includes('woman') || 
                 voiceNameLower.includes('heera') || voiceNameLower.includes('nisha') ||
                 voiceNameLower.includes('lekha') || voiceNameLower.includes('kalpana') ||
                 voiceNameLower.includes('samantha') || voiceNameLower.includes('victoria') ||
                 voiceNameLower.includes('zira') || voiceNameLower.includes('swara');
        } else {
          return voiceNameLower.includes('male') || voiceNameLower.includes('man') ||
                 voiceNameLower.includes('rishi') || voiceNameLower.includes('sharad') ||
                 voiceNameLower.includes('hemant') || voiceNameLower.includes('prabhat') ||
                 voiceNameLower.includes('david') || voiceNameLower.includes('mark') ||
                 voiceNameLower.includes('james') || voiceNameLower.includes('george');
        }
      });

      // **FALLBACK: Try gender-specific voices from any language**
      if (!preferredVoice) {
        preferredVoice = voices.find(voice => {
          const voiceNameLower = voice.name.toLowerCase();
          if (genderPreference === 'female') {
            return voiceNameLower.includes('female') || voiceNameLower.includes('woman');
          } else {
            return voiceNameLower.includes('male') || voiceNameLower.includes('man');
          }
        });
      }
      
      // **FALLBACK 2: Any Indian voice or language-matched voice**
      if (!preferredVoice && voicePool.length > 0) {
        preferredVoice = voicePool[0];
      }
      
      // **LAST RESORT: Any voice**
      if (!preferredVoice && voices.length > 0) {
        preferredVoice = voices[0];
      }
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`Selected voice: ${preferredVoice.name} (${preferredVoice.lang}) for ${genderPreference}`);
      } else {
        console.log('No preferred voice found, using default');
      }

      utterance.onstart = () => {
        if (chunkIndex === 0) {
          // Only set states on first chunk
          setIsSpeaking(true);
          setIsLoading(false);
          setIsTTSPlaying(true); // Notify music player to duck
          if (textChunks.length > 1) {
            console.log(`TTS: Playing ${textChunks.length} chunks`);
          }
        }
      };

      utterance.onend = () => {
        clearTimeout(timeoutId);
        // Only log completion on last chunk
        if (chunkIndex === textChunks.length - 1) {
          console.log('TTS: Completed');
        }
        // Speak next chunk
        speakChunk(chunkIndex + 1);
      };

      utterance.onerror = (event) => {
        clearTimeout(timeoutId);
        setIsSpeaking(false);
        setIsLoading(false);
        setIsTTSPlaying(false); // Restore music on error
        
        // Don't show error toast if user manually stopped
        if (isManuallyStopped) {
          console.log('Speech stopped by user');
          return;
        }
        
        // Check if this is a user-initiated stop (not a real error)
        if (event.error === 'canceled' || event.error === 'interrupted') {
          console.log('Speech stopped (not an error)');
          return;
        }
        
        // Log actual errors
        console.error('Speech synthesis error:', event.error);
        
        // Provide specific error messages for real errors
        if (event.error === 'synthesis-failed') {
          toast.error('Speech failed. Try selecting a different voice or using shorter text.', {
            description: 'Tip: Try the manual voice selector below'
          });
        } else if (event.error === 'not-allowed') {
          toast.error('Speech permission denied. Please allow audio in your browser settings.');
        } else if (event.error === 'network') {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error(`Speech error: ${event.error}`, {
            description: 'Try refreshing the page or using a different browser'
          });
        }
      };

      // Add timeout fallback for this chunk
      timeoutId = setTimeout(() => {
        if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          setIsLoading(false);
          setIsTTSPlaying(false); // Restore music on timeout
          toast.error('Speech timeout. The text might be too long or voice unavailable.');
        }
      }, 30000); // 30 second timeout per chunk

      try {
        window.speechSynthesis.speak(utterance);
        // Only log on first chunk to reduce console clutter
        if (chunkIndex === 0) {
          console.log('TTS started with voice:', preferredVoice?.name || 'default', `(${voiceLang})`);
        }
      } catch (error) {
        console.error('Failed to speak chunk:', error);
        clearTimeout(timeoutId);
        setIsLoading(false);
        setIsSpeaking(false);
        setIsTTSPlaying(false);
        toast.error('Failed to start speech. Try again.');
      }
    };

    // Start speaking from first chunk
    speakChunk(0);
  };

  // Load voices (some browsers need this)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={speak}
        variant="ghost"
        size="sm"
        className={className}
        disabled={isLoading}
        title={isSpeaking ? "Stop reading" : "Read wish aloud"}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSpeaking ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
        <span className="ml-2">
          {isLoading ? 'Loading...' : isSpeaking ? 'Stop' : 'Listen'}
        </span>
      </Button>

      {showVoiceSelector && !isSpeaking && (
        <Select 
          value={selectedVoiceType} 
          onValueChange={(value: 'male' | 'female' | 'auto') => setSelectedVoiceType(value)}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue placeholder="Voice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">
              <span className="text-xs">🎭 Auto</span>
            </SelectItem>
            <SelectItem value="female">
              <span className="text-xs">👩 Female</span>
            </SelectItem>
            <SelectItem value="male">
              <span className="text-xs">👨 Male</span>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
