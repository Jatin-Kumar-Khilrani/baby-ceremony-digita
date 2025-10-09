import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, Copy } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface QRCodeComponentProps {
  url: string
}

export default function QRCodeComponent({ url }: QRCodeComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff'
        }
      })
    }
  }, [url])

  const downloadQR = () => {
    if (canvasRef.current) {
      const link = document.createElement('a')
      link.download = 'baby-parv-invitation-qr.png'
      link.href = canvasRef.current.toDataURL()
      link.click()
      toast.success('QR Code downloaded!')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Invitation link copied!')
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="p-4 bg-white rounded-lg shadow-lg">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
      
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Scan this QR code to open the digital invitation
      </p>
      
      <div className="flex gap-2">
        <Button onClick={downloadQR} variant="outline" size="sm">
          <Download size={16} className="mr-2" />
          Download
        </Button>
        <Button onClick={copyLink} variant="outline" size="sm">
          <Copy size={16} className="mr-2" />
          Copy Link
        </Button>
      </div>
      
      <div className="w-full">
        <p className="text-xs text-muted-foreground mb-2">Invitation URL:</p>
        <div className="bg-muted p-2 rounded text-xs break-all">
          {url}
        </div>
      </div>
    </div>
  )
}