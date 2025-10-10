import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ShieldCheck, Lock } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AdminAuthProps {
  onAuthenticated: () => void
}

// Admin credentials from environment variables
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@baby-ceremony.com'
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234' // 4-digit PIN

export function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [showPinInput, setShowPinInput] = useState(false)

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setShowPinInput(true)
      toast.success('Email verified! Please enter your PIN.')
    } else {
      toast.error('Invalid admin email address')
    }
  }

  const handlePinComplete = (value: string) => {
    setPin(value)
    
    if (value.length === 4) {
      verifyPin(value)
    }
  }

  const verifyPin = (pinValue: string) => {
    setIsVerifying(true)
    
    // Simulate a brief verification delay
    setTimeout(() => {
      if (pinValue === ADMIN_PIN) {
        toast.success('🎉 Authentication successful! Welcome to Admin Panel.')
        
        // Store authentication in sessionStorage (expires when browser closes)
        sessionStorage.setItem('adminAuth', JSON.stringify({
          authenticated: true,
          timestamp: Date.now(),
          email: email
        }))
        
        onAuthenticated()
      } else {
        toast.error('Incorrect PIN. Please try again.')
        setPin('')
      }
      setIsVerifying(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-10 h-10 text-white" weight="bold" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Admin Authentication
          </CardTitle>
          <CardDescription>
            Verify your identity to access the admin panel
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!showPinInput ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@baby-ceremony.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Continue
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 justify-center">
                  <Lock className="w-4 h-4" />
                  Enter 4-Digit PIN
                </Label>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Logged in as: <span className="font-medium text-purple-600">{email}</span>
                </p>
                
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={pin}
                    onChange={handlePinComplete}
                    disabled={isVerifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPinInput(false)
                    setEmail('')
                    setPin('')
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => verifyPin(pin)}
                  disabled={pin.length !== 4 || isVerifying}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isVerifying ? 'Verifying...' : 'Verify PIN'}
                </Button>
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <p className="text-xs text-center text-gray-500">
              🔒 This is a secure admin area. Only authorized users should access this page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
