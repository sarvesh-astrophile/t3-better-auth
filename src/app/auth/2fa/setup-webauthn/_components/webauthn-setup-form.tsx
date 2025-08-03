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
import { Key, Fingerprint, Usb, InfoIcon, CheckCircle2 } from "lucide-react"

export function WebAuthnSetupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Set up Security Key</CardTitle>
          <CardDescription>
            Add a security key or enable biometric authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device Support Check */}
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertDescription>
              Your device supports WebAuthn authentication. You can use security keys, fingerprint, or face recognition.
            </AlertDescription>
          </Alert>

          {/* Authentication Methods */}
          <div className="space-y-4">
            <h3 className="font-medium">Choose your authentication method</h3>
            
            <div className="grid gap-4">
              {/* Security Key Option */}
              <div className="border-border flex items-center space-x-4 rounded-lg border p-4">
                <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                  <Key className="size-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Security Key</h4>
                  <p className="text-muted-foreground text-sm">Use a physical security key like YubiKey</p>
                </div>
                <Button variant="outline">
                  <Usb className="mr-2 size-4" />
                  Add Key
                </Button>
              </div>

              {/* Biometric Option */}
              <div className="border-border flex items-center space-x-4 rounded-lg border p-4">
                <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                  <Fingerprint className="size-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Biometric Authentication</h4>
                  <p className="text-muted-foreground text-sm">Use fingerprint, face, or voice recognition</p>
                </div>
                <Button variant="outline">
                  Setup Biometric
                </Button>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="space-y-4">
            <h3 className="font-medium">Setup Instructions</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-medium">
                  1
                </div>
                <p>Click "Add Key" or "Setup Biometric" above</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-medium">
                  2
                </div>
                <p>Follow the browser prompts to register your authenticator</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-medium">
                  3
                </div>
                <p>Give your authenticator a memorable name</p>
              </div>
            </div>
          </div>

          {/* Name the authenticator */}
          <div className="space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="authenticator-name">Authenticator Name</Label>
              <Input
                id="authenticator-name"
                type="text"
                placeholder="My YubiKey"
                />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="button" className="flex-1">
              Register Authenticator
            </Button>
          </div>

          {/* Additional Info */}
          <Alert>
            <InfoIcon className="size-4" />
            <AlertDescription>
              WebAuthn provides the highest level of security. Your authenticator never leaves your device, making it impossible to phish.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}