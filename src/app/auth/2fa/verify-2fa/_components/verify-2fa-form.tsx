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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smartphone, Key, ShieldCheck } from "lucide-react"

export function Verify2FAForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Choose your preferred verification method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="totp" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="totp">
                <Smartphone className="mr-2 size-4" />
                TOTP
              </TabsTrigger>
              <TabsTrigger value="webauthn">
                <Key className="mr-2 size-4" />
                WebAuthn
              </TabsTrigger>
              <TabsTrigger value="recovery">
                <ShieldCheck className="mr-2 size-4" />
                Recovery
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="totp" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </div>
              <form className="space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="totp-code">Authentication Code</Label>
                  <Input
                    id="totp-code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Verify Code
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="webauthn" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Use your security key or biometric authentication
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-muted flex size-16 items-center justify-center rounded-full">
                  <Key className="size-8 text-muted-foreground" />
                </div>
                <Button className="w-full">
                  Authenticate with Security Key
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="recovery" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Enter one of your recovery codes
              </div>
              <form className="space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="recovery-code">Recovery Code</Label>
                  <Input
                    id="recovery-code"
                    type="text"
                    placeholder="xxxx-xxxx-xxxx"
                    className="text-center"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Verify Recovery Code
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm">
            Having trouble?{" "}
            <a href="#" className="underline underline-offset-4">
              Contact support
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}