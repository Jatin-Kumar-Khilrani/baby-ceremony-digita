# 🎙️ Audio Wishes Feature - Implementation Guide

## ✅ What Was Implemented

### **Backend (Azure Functions)**

#### 1. **`api/audio-wishes.ts`** - Audio File Management
- **POST**: Upload audio recordings to Azure Blob Storage
  - Accepts base64 encoded audio
  - Supports WebM, MP3, WAV formats
  - Max file size: 5MB
  - Returns audio URL for storage
- **GET**: List all audio files (admin)
- **DELETE**: Remove audio files
- **Storage**: `audio-wishes` container (public read access)

#### 2. **`api/text-to-speech.ts`** - TTS Endpoint
- Simple endpoint that recommends client-side Web Speech API
- No Azure Cognitive Services needed (free!)
- Supports multiple languages

#### 3. **`api/wishes.ts`** - Updated Wishes API
Added audio fields to wish data structure:
```typescript
{
  id: string,
  name: string,
  message: string,
  email: string | null,
  audioUrl: string | null,      // NEW: Audio recording URL
  audioDuration: number | null,  // NEW: Duration in seconds
  hasAudio: boolean,             // NEW: Boolean flag
  timestamp: number
}
```

### **Frontend (React Components)**

#### 1. **`src/components/AudioRecorder.tsx`** 🎙️
Full-featured audio recording component:
- ✅ Start/Stop/Pause recording
- ✅ Real-time duration counter
- ✅ Maximum duration limit (180 seconds / 3 minutes)
- ✅ Preview playback before uploading
- ✅ Delete and re-record
- ✅ Upload to Azure Blob Storage
- ✅ Browser compatibility detection (WebM/OGG/MP4)
- ✅ Microphone permission handling

**Features:**
- Recording indicator with pulsing red dot
- Built-in audio player for preview
- Progress timer (0:00 / 3:00)
- One-click upload after review

#### 2. **`src/components/TextToSpeech.tsx`** 🔊
Client-side text-to-speech using Web Speech API:
- ✅ Reads text wishes aloud
- ✅ Auto-detect language (English/Hindi/Sindhi)
- ✅ Adjustable speed, pitch, volume
- ✅ Stop/Start toggle
- ✅ Works offline (no API calls needed!)

**Supported Languages:**
- English (en-US)
- Hindi (hi-IN) - Auto-detected from Devanagari script
- Sindhi - Uses Hindi voice as fallback

## 🔧 Integration Guide

### **Step 1: Add to Wishes Form**

Update `src/pages/Wishes.tsx` or your wishes component:

```typescript
import { AudioRecorder } from '@/components/AudioRecorder';
import { useState } from 'react';

function WishesForm() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);

  const handleAudioRecorded = (url: string, duration: number) => {
    setAudioUrl(url);
    setAudioDuration(duration);
    console.log('Audio recorded:', url, duration);
  };

  const handleSubmit = async (formData) => {
    const wishData = {
      name: formData.name,
      message: formData.message,
      email: formData.email,
      audioUrl: audioUrl,           // Include audio
      audioDuration: audioDuration,
    };
    
    // Submit to API
    const response = await fetch('/api/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wishData),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Existing form fields */}
      <input name="name" />
      <textarea name="message" />
      
      {/* NEW: Audio Recorder */}
      <AudioRecorder 
        onAudioRecorded={handleAudioRecorded}
        maxDuration={180}  // 3 minutes
      />
      
      <button type="submit">Submit Wish</button>
    </form>
  );
}
```

### **Step 2: Display Audio in Wishes List**

Update `src/components/GuestWishes.tsx`:

```typescript
import { TextToSpeech } from '@/components/TextToSpeech';

function WishCard({ wish }) {
  return (
    <div className="wish-card">
      <h3>{wish.name}</h3>
      <p>{wish.message}</p>
      
      {/* NEW: Display audio if available */}
      {wish.hasAudio && wish.audioUrl && (
        <div className="mt-4 space-y-2">
          <audio 
            src={wish.audioUrl} 
            controls 
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            🎙️ Audio wish ({Math.floor(wish.audioDuration / 60)}:{(wish.audioDuration % 60).toString().padStart(2, '0')})
          </p>
        </div>
      )}
      
      {/* NEW: Text-to-Speech for text wishes */}
      {wish.message && !wish.hasAudio && (
        <TextToSpeech text={wish.message} />
      )}
    </div>
  );
}
```

### **Step 3: Build and Deploy**

```powershell
# Build API
cd api
npm run build

# Commit changes
git add api/audio-wishes.ts api/text-to-speech.ts api/wishes.ts
git add src/components/AudioRecorder.tsx src/components/TextToSpeech.tsx
git commit -m "feat: Add audio recording and text-to-speech for wishes"
git push origin main
```

## 🎯 User Experience

### **Recording Audio:**
1. Click "Start Recording" 🎙️
2. Speak your wish (max 3 minutes)
3. Click "Stop" when done
4. Preview your recording ▶️
5. Delete and re-record if needed 🗑️
6. Click "Use This Recording" ✅
7. Submit your wish

### **Listening to Wishes:**
- **Audio wishes**: See audio player, click play ▶️
- **Text wishes**: Click "Listen" button to hear AI read it 🔊
- **Both types**: Everyone's wishes can be heard!

## 📊 Storage Requirements

### **Azure Blob Storage:**
New container: `audio-wishes`
- Access level: Public read (blob)
- Expected size: ~1-2 MB per audio (3 min at medium quality)
- Cost: Very minimal (Azure Storage is cheap)

Example for 100 wishes:
- 100 wishes × 2 MB = 200 MB total
- Azure cost: ~$0.01/month

### **Environment Variables:**
Already configured:
- `AZURE_STORAGE_CONNECTION_STRING` ✅

No new variables needed!

## 🧪 Testing Checklist

### **Audio Recording:**
- [ ] Click "Start Recording" prompts for mic permission
- [ ] Recording starts and timer counts up
- [ ] Pause/Resume works correctly
- [ ] Stop ends recording and shows preview
- [ ] Preview audio plays correctly
- [ ] Delete removes recording
- [ ] Upload succeeds and returns URL
- [ ] Max duration (3 min) stops recording automatically

### **Text-to-Speech:**
- [ ] "Listen" button appears on text wishes
- [ ] Clicking starts reading aloud
- [ ] Clicking again stops reading
- [ ] Hindi text detected and uses Hindi voice
- [ ] English text uses English voice
- [ ] Works without internet (client-side)

### **Wishes Submission:**
- [ ] Can submit with audio only
- [ ] Can submit with text only
- [ ] Can submit with both text and audio
- [ ] Audio URL saved in wishes.json
- [ ] Duration saved correctly

### **Admin View:**
- [ ] Can see audio player for audio wishes
- [ ] Can listen to all audio wishes
- [ ] Can delete wishes with audio (orphaned files handled)

## 🎉 Features Summary

### **What Users Get:**
✅ **Record Voice Wishes** - Personal, heartfelt audio messages  
✅ **Preview Before Sending** - Make sure it sounds right  
✅ **Text-to-Speech** - All text wishes can be heard  
✅ **Flexible** - Audio only, text only, or both!  
✅ **Easy to Use** - Simple recording interface  
✅ **Accessible** - Everyone can listen to wishes  

### **Technical Highlights:**
✅ **No Extra Cost** - Uses Web Speech API (free!)  
✅ **Browser Native** - Works on all modern browsers  
✅ **Azure Storage** - Reliable cloud storage  
✅ **Auto Format Detection** - WebM/MP3/WAV support  
✅ **Size Limits** - Prevents huge files (5MB max)  
✅ **Multi-Language** - English, Hindi, Sindhi  

## 📝 Next Steps

1. **Integrate into existing wishes form**
2. **Update GuestWishes component to display audio**
3. **Test on different browsers** (Chrome, Safari, Firefox)
4. **Test on mobile devices** (audio recording support varies)
5. **Deploy to production**

## 🚀 Ready to Deploy!

All backend APIs and frontend components are created. Just need to:
1. Wire them into your existing wishes flow
2. Build and deploy
3. Test thoroughly

**Estimated Total Implementation Time:** 30 minutes to integrate + test

---

**Created:** October 17, 2025  
**Status:** ✅ Ready for Integration
