import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onAudioRecorded: (audioUrl: string, duration: number) => void;
  maxDuration?: number; // seconds
}

export function AudioRecorder({ onAudioRecorded, maxDuration = 180 }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [amplification, setAmplification] = useState(1); // 1 = normal, 2 = 2x louder, etc.
  const [isAmplifying, setIsAmplifying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const originalBlobRef = useRef<Blob | null>(null); // Store original for re-amplification
  const previousUrlRef = useRef<string | null>(null); // Track previous URL for cleanup

  useEffect(() => {
    // Revoke previous URL when a new one is created
    if (previousUrlRef.current && previousUrlRef.current !== audioUrl) {
      console.log('Revoking previous URL:', previousUrlRef.current);
      URL.revokeObjectURL(previousUrlRef.current);
    }
    previousUrlRef.current = audioUrl;

    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) {
        console.log('Cleanup: Revoking URL on unmount');
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Reload audio element when URL changes (important for amplification)
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      // Small delay to ensure blob is ready
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          console.log('Audio element reloaded with new URL:', audioUrl);
        }
      }, 100);
    }
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      // Check mobile compatibility
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('Mobile device detected');
        if (isIOS) {
          console.log('iOS device - MediaRecorder supported on iOS 14.3+');
        }
      }

      // Request audio with noise suppression and echo cancellation
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100 // Good quality
        } 
      });
      
      // Check browser support for different MIME types with compression
      let mimeType = 'audio/webm;codecs=opus'; // Best compression
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg;codecs=opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'; // iOS fallback
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/wav'; // Last resort
      }

      console.log('Using MIME type:', mimeType);

      // Use compression with bitrate limit
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 64000 // 64kbps for good quality with smaller file size
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            toast.warning(`Maximum recording duration (${maxDuration}s) reached`);
          }
          return newDuration;
        });
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success('Recording stopped');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setIsPlaying(false);
    setAmplification(1);
    originalBlobRef.current = null;
    toast.info('Recording deleted');
  };

  const amplifyAudio = async (gainValue: number) => {
    if (!audioBlob && !originalBlobRef.current) return;

    setIsAmplifying(true);
    try {
      // Use original blob if available, otherwise current blob
      const sourceBlob = originalBlobRef.current || audioBlob;
      if (!sourceBlob) return;

      // Store original if not already stored
      if (!originalBlobRef.current) {
        originalBlobRef.current = sourceBlob;
      }

      // Create audio context
      const audioContext = new AudioContext();
      
      // Convert blob to array buffer
      const arrayBuffer = await sourceBlob.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      // Create buffer source
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Create gain node for amplification
      const gainNode = offlineContext.createGain();
      gainNode.gain.value = gainValue;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      
      // Start processing
      source.start(0);
      
      // Render audio
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert back to blob
      const wavBlob = await audioBufferToWav(renderedBuffer);
      
      // Update state with amplified audio
      // Don't revoke immediately - let the useEffect handle it via previousUrlRef
      const newUrl = URL.createObjectURL(wavBlob);
      console.log('Amplification: Created new URL:', newUrl);
      setAudioBlob(wavBlob);
      setAudioUrl(newUrl); // This triggers useEffect which will revoke the old URL
      
      // Force audio element to reload the new source after a small delay
      setTimeout(() => {
        if (audioRef.current) {
          console.log('Amplification: Reloading audio element with new URL');
          audioRef.current.load();
          setIsPlaying(false);
        }
      }, 100);
      
      toast.success(`Volume ${gainValue > 1 ? 'increased' : 'decreased'} to ${Math.round(gainValue * 100)}%`);
    } catch (error) {
      console.error('Error amplifying audio:', error);
      toast.error('Failed to amplify audio. Please try again.');
    } finally {
      setIsAmplifying(false);
    }
  };

  // Helper function to convert AudioBuffer to WAV Blob
  const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF identifier
    setUint32(0x46464952);
    // File length
    setUint32(36 + length);
    // RIFF type
    setUint32(0x45564157);
    // Format chunk identifier
    setUint32(0x20746d66);
    // Format chunk length
    setUint32(16);
    // Sample format (raw)
    setUint16(1);
    // Channel count
    setUint16(numberOfChannels);
    // Sample rate
    setUint32(audioBuffer.sampleRate);
    // Byte rate
    setUint32(audioBuffer.sampleRate * numberOfChannels * 2);
    // Block align
    setUint16(numberOfChannels * 2);
    // Bits per sample
    setUint16(16);
    // Data chunk identifier
    setUint32(0x61746164);
    // Data chunk length
    setUint32(length);

    // Write audio data
    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }

    while (pos < buffer.byteLength) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        const wishId = Date.now().toString();
        const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/audio-wishes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wishId,
            audioData: base64Audio,
            mimeType: audioBlob.type,
            duration,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to upload audio');
        }

        const data = await response.json();
        onAudioRecorded(data.audioUrl, duration);
        toast.success('Audio uploaded successfully!');
        
        // Clear the recording state after successful upload (without showing "deleted" message)
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioBlob(null);
        setAudioUrl(null);
        setDuration(0);
        setIsPlaying(false);
      };
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Failed to upload audio. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">🎙️ Record Audio Wish</h3>
        <span className="text-sm text-muted-foreground">
          {formatTime(duration)} / {formatTime(maxDuration)}
        </span>
      </div>

      {!audioUrl && !isRecording && (
        <Button type="button" onClick={startRecording} className="w-full" variant="default">
          <Mic className="w-4 h-4 mr-2" />
          Start Recording
        </Button>
      )}

      {isRecording && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button type="button" onClick={pauseRecording} className="flex-1" variant="secondary">
              {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button type="button" onClick={stopRecording} className="flex-1" variant="destructive">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Recording...</span>
          </div>
        </div>
      )}

      {audioUrl && (
        <div className="space-y-2">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="w-full"
            controls
          />
          <div className="flex gap-2">
            <Button type="button" onClick={playAudio} className="flex-1" variant="secondary">
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button type="button" onClick={deleteRecording} variant="destructive" size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Volume Amplification Controls */}
          <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-blue-900">
                🔊 Amplify Volume
              </label>
              <span className="text-xs text-blue-700 font-semibold">
                {Math.round(amplification * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={amplification}
              onChange={(e) => setAmplification(parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              disabled={isAmplifying}
              aria-label="Volume amplification slider"
            />
            <div className="flex items-center justify-between text-xs text-blue-600">
              <span>50%</span>
              <span>100% (Normal)</span>
              <span>300%</span>
            </div>
            <Button
              type="button"
              onClick={() => amplifyAudio(amplification)}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
              disabled={isAmplifying || amplification === 1}
            >
              {isAmplifying ? 'Processing...' : 'Apply Amplification'}
            </Button>
            <p className="text-xs text-blue-700 italic">
              💡 Adjust slider and click "Apply" to boost or reduce volume permanently
            </p>
          </div>
          
          <Button 
            type="button"
            onClick={uploadAudio} 
            className="w-full" 
            disabled={isUploading || isAmplifying}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Use This Recording'}
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Maximum duration: {formatTime(maxDuration)} • Format: WebM/MP3
      </p>
    </div>
  );
}
