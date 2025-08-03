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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Download, Shield, AlertTriangle, CheckCircle2 } from "lucide-react"

export function RecoveryCodesForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // Mock recovery codes - in real app these would come from the server
  const recoveryCodes = [
    "a1b2-c3d4-e5f6",
    "g7h8-i9j0-k1l2",
    "m3n4-o5p6-q7r8",
    "s9t0-u1v2-w3x4",
    "y5z6-a7b8-c9d0",
    "e1f2-g3h4-i5j6",
    "k7l8-m9n0-o1p2",
    "q3r4-s5t6-u7v8",
  ]

  const copyAllCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'))
  }

  const downloadCodes = () => {
    const blob = new Blob([recoveryCodes.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'recovery-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Recovery Codes</CardTitle>
          <CardDescription>
            Save these codes in a secure location. Each code can only be used once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              <strong>Important:</strong> Store these codes safely. They're your only way to recover your account if you lose access to your other 2FA methods.
            </AlertDescription>
          </Alert>

          {/* Recovery Codes Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Your Recovery Codes</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyAllCodes}>
                  <Copy className="mr-2 size-4" />
                  Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCodes}>
                  <Download className="mr-2 size-4" />
                  Download
                </Button>
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3">
                {recoveryCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-background border-border flex items-center justify-between rounded border p-3 font-mono text-sm"
                  >
                    <span>{code}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(code)}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Instructions */}
          <div className="space-y-4">
            <h3 className="font-medium">Security Guidelines</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <Shield className="text-green-600 mt-0.5 size-4 flex-shrink-0" />
                <p>Store these codes in a password manager or secure offline location</p>
              </div>
              <div className="flex gap-3">
                <Shield className="text-green-600 mt-0.5 size-4 flex-shrink-0" />
                <p>Never share these codes with anyone</p>
              </div>
              <div className="flex gap-3">
                <Shield className="text-green-600 mt-0.5 size-4 flex-shrink-0" />
                <p>Each code can only be used once - generate new codes after using several</p>
              </div>
              <div className="flex gap-3">
                <Shield className="text-green-600 mt-0.5 size-4 flex-shrink-0" />
                <p>You can regenerate new codes anytime from your security settings</p>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="size-4" />
            <AlertDescription>
              Please confirm you have safely stored these recovery codes before continuing.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1">
              Regenerate Codes
            </Button>
            <Button type="button" className="flex-1">
              I've Saved My Codes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}