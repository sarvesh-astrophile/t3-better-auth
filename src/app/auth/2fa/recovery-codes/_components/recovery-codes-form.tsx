"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Copy, Shield, RefreshCw, Loader2, AlertTriangle } from "lucide-react"
import { api } from "@/trpc/react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "@/lib/auth-client"

export function RecoveryCodesForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  
  const [password, setPassword] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showCodes, setShowCodes] = useState(false)

  // Generate backup codes mutation
  const generateBackupCodesMutation = api.auth.generateBackupCodes.useMutation({
    onSuccess: (data) => {
      if (data.data?.backupCodes) {
        setBackupCodes(data.data.backupCodes)
        setShowCodes(true)
        toast({
          title: "Backup Codes Generated",
          description: "New backup codes have been generated. Save them in a secure place.",
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

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password to generate backup codes.",
        variant: "destructive",
      })
      return
    }

    await generateBackupCodesMutation.mutateAsync({
      password,
    })
  }

  const copyBackupCodes = async () => {
    if (!backupCodes.length) return
    
    try {
      const codesText = backupCodes.join('\n')
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

  const downloadBackupCodes = () => {
    if (!backupCodes.length) return
    
    const codesText = backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Downloaded",
      description: "Backup codes have been downloaded as a text file.",
    })
  }

  if (!showCodes) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Manage Recovery Codes</CardTitle>
            <CardDescription>
              Generate new backup codes for your two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertTriangle className="size-4" />
              <AlertDescription>
                <strong>Important:</strong> Generating new backup codes will invalidate all existing backup codes. 
                Make sure to save the new codes in a secure location.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleGenerateCodes} className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="password">Confirm Your Password</Label>
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
                  disabled={generateBackupCodesMutation.isPending || !password.trim()}
                >
                  {generateBackupCodesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 size-4" />
                      Generate New Codes
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Your Recovery Codes</CardTitle>
          <CardDescription>
            Save these backup codes in a secure place. Each code can only be used once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Shield className="size-4" />
            <AlertDescription>
              These codes can be used to access your account if you lose access to your authenticator app. 
              Store them safely and never share them with anyone.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-6 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-3 bg-background rounded border text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={copyBackupCodes}
                className="flex-1"
              >
                <Copy className="mr-2 size-4" />
                Copy All Codes
              </Button>
              <Button 
                variant="outline" 
                onClick={downloadBackupCodes}
                className="flex-1"
              >
                <Shield className="mr-2 size-4" />
                Download as File
              </Button>
            </div>
            
            <Button 
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              <strong>Remember:</strong> Each backup code can only be used once. When you use a backup code, 
              it will be permanently deleted from your account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}