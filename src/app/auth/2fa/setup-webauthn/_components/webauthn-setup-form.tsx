"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Key,
  Fingerprint,
  Usb,
  InfoIcon,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { passkey } from "@/lib/auth-client";

export function WebAuthnSetupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for WebAuthn support
    const checkSupport = async () => {
      if (typeof window !== "undefined" && window.PublicKeyCredential) {
        try {
          // WebAuthn is supported if PublicKeyCredential exists
          // Platform authenticator availability is checked separately for each type
          setIsSupported(true);
          console.log("WebAuthn is supported on this device");
          
          // Check for platform authenticator availability
          if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
            const platformAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            console.log("Platform authenticator available:", platformAvailable);
          }
          
          // Check for conditional mediation support
          if (window.PublicKeyCredential.isConditionalMediationAvailable) {
            const conditionalAvailable = await window.PublicKeyCredential.isConditionalMediationAvailable();
            console.log("Conditional mediation available:", conditionalAvailable);
          }
        } catch (error) {
          console.error("Error checking WebAuthn support:", error);
          setIsSupported(!!window.PublicKeyCredential);
        }
      } else {
        setIsSupported(false);
        console.log("WebAuthn is not supported on this device");
      }
    };
    
    checkSupport();
  }, []);

  const handleRegister = async () => {
    await handleRegisterWithType();
  };

  const handleRegisterWithType = async (authenticatorAttachment?: "platform" | "cross-platform") => {
    if (!name.trim()) {
      setError("Please provide a name for your authenticator.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // Build options object according to Better Auth passkey plugin specs
      const options: any = {
        name: name.trim(),
      };
      
      // Only add authenticatorAttachment if specified
      if (authenticatorAttachment) {
        options.authenticatorAttachment = authenticatorAttachment;
      }
      
      const result = await passkey.addPasskey(options);
      
      console.log("Passkey registration result:", result);
      
      toast({
        title: "Success",
        description: `${authenticatorAttachment === "platform" ? "Biometric" : "Security key"} registered successfully!`,
      });
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Passkey registration error:", err);
      const errorMessage = err.message || "An unexpected error occurred.";
      setError(errorMessage);
      
      // Provide more specific error messages based on Better Auth error patterns
      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes("NotAllowedError") || errorMessage.includes("AbortError")) {
        userFriendlyMessage = "Registration was cancelled or timed out. Please try again.";
      } else if (errorMessage.includes("NotSupportedError")) {
        userFriendlyMessage = "This authenticator type is not supported on your device.";
      } else if (errorMessage.includes("InvalidStateError")) {
        userFriendlyMessage = "This authenticator is already registered.";
      } else if (errorMessage.includes("ConstraintError")) {
        userFriendlyMessage = "The authenticator doesn't meet the security requirements.";
      } else if (errorMessage.includes("SecurityError")) {
        userFriendlyMessage = "Security error occurred. Please ensure you're on a secure connection.";
      } else if (errorMessage.includes("NotReadableError")) {
        userFriendlyMessage = "Authenticator is not available or cannot be used.";
      }
      
      toast({
        title: "Registration Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          {isSupported ? (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                Your device supports WebAuthn authentication. You can use security
                keys, fingerprint, or face recognition.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <InfoIcon className="size-4" />
              <AlertDescription>
                Your browser does not support WebAuthn.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-medium">
              Choose your authentication method
            </h3>
            <div className="grid gap-4">
              <div className="border-border flex items-center space-x-4 rounded-lg border p-4">
                <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                  <Key className="size-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Security Key</h4>
                  <p className="text-muted-foreground text-sm">
                    Use a physical security key like YubiKey
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleRegisterWithType("cross-platform")} 
                  disabled={isLoading || !isSupported}
                >
                  <Usb className="mr-2 size-4" />
                  Add Key
                </Button>
              </div>

              <div className="border-border flex items-center space-x-4 rounded-lg border p-4">
                <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-lg">
                  <Fingerprint className="size-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Biometric Authentication</h4>
                  <p className="text-muted-foreground text-sm">
                    Use fingerprint, face, or voice recognition
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => handleRegisterWithType("platform")} 
                  disabled={isLoading || !isSupported}
                >
                  Setup Biometric
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Setup Instructions</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  1
                </div>
                <p>Click "Add Key" or "Setup Biometric" above</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  2
                </div>
                <p>
                  Follow the browser prompts to register your authenticator
                </p>
              </div>
              <div className="flex gap-3">
                <div className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  3
                </div>
                <p>Give your authenticator a memorable name</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="authenticator-name">
                Authenticator Name
              </Label>
              <Input
                id="authenticator-name"
                type="text"
                placeholder="My YubiKey"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/dashboard")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleRegister}
              disabled={isLoading || !name || !isSupported}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Authenticator"
              )}
            </Button>
          </div>

          <Alert>
            <InfoIcon className="size-4" />
            <AlertDescription>
              WebAuthn provides the highest level of security. Your
              authenticator never leaves your device, making it impossible to
              phish.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
