import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Camera, Upload, Image as ImageIcon, Heart } from '@phosphor-icons/react'

interface Photo {
  id: string
  name: string
  url: string
  caption: string
  timestamp: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071'

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadData, setUploadData] = useState({
    name: '',
    caption: '',
    file: null as File | null
  })
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch photos from backend
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/photos`)
        if (response.ok) {
          const data = await response.json()
          // Ensure data is always an array
          setPhotos(Array.isArray(data) ? data : [])
        } else {
          setPhotos([])
        }
      } catch (error) {
        console.error('Failed to fetch photos:', error)
        setPhotos([])
        toast.error('Failed to load photos')
      } finally {
        setIsLoading(false)
      }
    }
    fetchPhotos()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setUploadData(prev => ({ ...prev, file }))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadData.name || !uploadData.file) {
      toast.error('Please fill in your name and select a photo')
      return
    }

    setIsUploading(true)

    try {
      // Convert file to base64 for storage
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64String = event.target?.result as string
        
        const newPhoto = {
          name: uploadData.name,
          url: base64String,
          caption: uploadData.caption,
        }

        // Send to backend
        const response = await fetch(`${API_BASE_URL}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newPhoto)
        })

        if (response.ok) {
          const savedPhoto = await response.json()
          setPhotos(prev => [...(Array.isArray(prev) ? prev : []), savedPhoto])
          
          toast.success('Photo uploaded successfully!')
          
          setUploadData({
            name: '',
            caption: '',
            file: null
          })
          
          // Reset file input
          const fileInput = document.getElementById('photo-upload') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        } else {
          toast.error('Failed to upload photo')
        }
        
        setIsUploading(false)
      }
      
      reader.onerror = () => {
        toast.error('Failed to read file')
        setIsUploading(false)
      }
      
      reader.readAsDataURL(uploadData.file)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photo')
      setIsUploading(false)
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
      {/* Upload Form */}
      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-script text-primary flex items-center justify-center gap-2">
            <Camera size={24} className="text-accent" />
            Share Your Photos
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Upload and share beautiful moments from the ceremony
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="photo-name">Your Name</Label>
              <Input
                id="photo-name"
                value={uploadData.name}
                onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="photo-upload">Select Photo</Label>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="photo-caption">Caption (Optional)</Label>
              <Input
                id="photo-caption"
                value={uploadData.caption}
                onChange={(e) => setUploadData(prev => ({ ...prev, caption: e.target.value }))}
                placeholder="Add a caption to your photo..."
              />
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isUploading}>
              <Upload size={18} className="mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-primary">
            Photo Gallery ({photos?.length || 0})
          </h3>
          <Badge variant="secondary" className="text-sm">
            <Heart size={14} className="mr-1" />
            Capturing Memories
          </Badge>
        </div>

        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.slice().reverse().map((photo) => (
              <Dialog key={photo.id}>
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={photo.url}
                        alt={photo.caption || `Photo by ${photo.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-primary">{photo.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(photo.timestamp)}
                        </span>
                      </div>
                      {photo.caption && (
                        <p className="text-xs text-muted-foreground truncate">
                          {photo.caption}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      Photo by {photo.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <img
                      src={photo.url}
                      alt={photo.caption || `Photo by ${photo.name}`}
                      className="w-full max-h-96 object-contain rounded-lg"
                    />
                    {photo.caption && (
                      <p className="text-center text-muted-foreground italic">
                        "{photo.caption}"
                      </p>
                    )}
                    <p className="text-center text-sm text-muted-foreground">
                      Uploaded on {formatDate(photo.timestamp)}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-muted">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon size={48} className="text-muted-foreground/50 mb-4" />
              <h4 className="text-lg font-medium text-muted-foreground mb-2">
                No photos yet
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                Be the first to share beautiful moments from baby Parv's welcome ceremony!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photography Guidelines */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Photography Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">What to Share:</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Candid moments during the ceremony</li>
                <li>• Family photos and group pictures</li>
                <li>• Beautiful decorations and setup</li>
                <li>• Special moments with baby Parv</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Photo Tips:</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Ensure good lighting for clear photos</li>
                <li>• Ask permission before photographing others</li>
                <li>• Share only appropriate family-friendly content</li>
                <li>• Add meaningful captions to your photos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}