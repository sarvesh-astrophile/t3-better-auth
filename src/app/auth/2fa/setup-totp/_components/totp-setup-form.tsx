"use client"

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
import { Copy, QrCode, Smartphone, InfoIcon } from "lucide-react"

export function TOTPSetupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // Mock data - in real app this would come from the server
  const secret = "JBSWY3DPEHPK3PXP"
  const qrCodeUrl = `otpauth://totp/Acme%20Inc:user@example.com?secret=${secret}&issuer=Acme%20Inc`

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
              <div className="bg-muted flex size-48 items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center text-muted-foreground">
                  <QrCode className="mx-auto mb-2 size-8" />
                  <p className="text-sm">QR Code would appear here</p>
                </div>
              </div>
              
              <Alert>
                <InfoIcon className="size-4" />
                <AlertDescription>
                  Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator to scan this code.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          {/* Step 2: Manual Entry */}
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
                  value={secret}
                  readOnly
                  className="font-mono"
                />
                <Button variant="outline" size="icon">
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Verify */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-sm font-medium">
                3
              </div>
              <h3 className="font-medium">Verify setup</h3>
            </div>
            
            <form className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="verification-code">Enter the 6-digit code from your app</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Enable TOTP
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}