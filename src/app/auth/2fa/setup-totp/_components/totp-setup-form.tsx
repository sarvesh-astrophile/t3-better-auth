"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import QRCode from "react-qr-code"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, QrCode, Smartphone, InfoIcon, Loader2, CheckCircle } from "lucide-react"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/lib/auth-client"

export function TOTPSetupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { data: session, isPending } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  const [step, setStep] = useState<"password" | "setup" | "verify">("password")

  // Redirect unverified users to email verification first
  useEffect(() => {
    if (!isPending && session?.user && !session.user.emailVerified) {
      toast({
        title: "Email Verification Required",
        description: "Please verify your email before setting up two-factor authentication.",
        variant: "destructive",
      });
      const verificationUrl = `/auth/verify-otp?email=${encodeURIComponent(session.user.email)}`;
      window.location.href = verificationUrl;
    }
  }, [session, isPending, toast]);
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [totpData, setTotpData] = useState<{
    totpURI?: string
    secret?: string
    backupCodes?: string[]
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Enable 2FA mutation
  const enableTwoFactorMutation = api.auth.enableTwoFactor.useMutation({
    onSuccess: (data) => {
      if (data.data?.totpURI) {
        const secret = new URL(data.data.totpURI).searchParams.get("secret")
        setTotpData({
          totpURI: data.data.totpURI,
          secret: secret ?? undefined,
          backupCodes: data.data.backupCodes,
        })
        setStep("setup")
        toast({
          title: "Two-Factor Authentication Enabled",
          description: "Please scan the QR code with your authenticator app.",
        })
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Verify TOTP mutation
  const verifyTotpMutation = api.auth.verifyTotp.useMutation({
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Two-factor authentication has been successfully enabled.",
      })
      router.push("/dashboard")
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password to continue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await enableTwoFactorMutation.mutateAsync({
        password,
        issuer: "Better Auth T3",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      })
      return
    }

    await verifyTotpMutation.mutateAsync({
      code: verificationCode,
      trustDevice: false,
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Secret key copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const copyBackupCodes = async () => {
    if (!totpData.backupCodes) return
    
    try {
      const codesText = totpData.backupCodes.join('\n')
      await navigator.clipboard.writeText(codesText)
      toast({
        title: "Copied!",
        description: "Backup codes copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy backup codes.",
        variant: "destructive",
      })
    }
  }

  // Password step
  if (step === "password") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Enable Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter your password to start setting up TOTP authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push("/dashboard")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading || !password.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Setup step
  if (step === "setup") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Set up Authenticator App</CardTitle>
            <CardDescription>
              Scan the QR code or enter the secret key manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: QR Code */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-sm font-medium">
                  1
                </div>
                <h3 className="font-medium">Scan QR Code</h3>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                {totpData.totpURI ? (
                  <div className="bg-white p-4 rounded-lg border">
                    <QRCode value={totpData.totpURI} size={200} />
                  </div>
                ) : (
                  <div className="bg-muted flex size-48 items-center justify-center rounded-lg border-2 border-dashed">
                    <div className="text-center text-muted-foreground">
                      <QrCode className="mx-auto mb-2 size-8" />
                      <p className="text-sm">Loading QR Code...</p>
                    </div>
                  </div>
                )}
                
                <Alert>
                  <InfoIcon className="size-4" />
                  <AlertDescription>
                    Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to scan this code.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Step 2: Manual Entry */}
            {totpData.secret && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-sm font-medium">
                    2
                  </div>
                  <h3 className="font-medium">Or enter manually</h3>
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="secret">Secret Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secret"
                      type="text"
                      value={totpData.secret}
                      readOnly
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(totpData.secret!)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Codes */}
            {totpData.backupCodes && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-sm font-medium">
                    !
                  </div>
                  <h3 className="font-medium">Save Your Backup Codes</h3>
                </div>
                
                <Alert>
                  <InfoIcon className="size-4" />
                  <AlertDescription>
                    Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    {totpData.backupCodes.map((code, index) => (
                      <div key={index} className="p-2 bg-background rounded border">
                        {code}
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 w-full"
                    onClick={copyBackupCodes}
                  >
                    <Copy className="mr-2 size-4" />
                    Copy All Backup Codes
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep("password")}
              >
                Back
              </Button>
              <Button 
                type="button" 
                className="flex-1"
                onClick={() => setStep("verify")}
              >
                Continue to Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verification step
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify Your Setup</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to complete setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep("setup")}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={verifyTotpMutation.isPending || verificationCode.length !== 6}
              >
                {verifyTotpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 size-4" />
                    Enable TOTP
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}