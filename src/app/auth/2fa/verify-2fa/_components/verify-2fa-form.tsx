"use client";

import { useState } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Smartphone, Key, ShieldCheck, Loader2 } from "lucide-react";
import { twoFactor, useSession } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { startAuthentication } from "@simplewebauthn/browser";

export function Verify2FAForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();

  const [totpCode, setTotpCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthenticationOptions =
    api.webauthn.getAuthenticationOptions.useMutation();
  const verifyAuthentication =
    api.webauthn.verifyAuthentication.useMutation();

  // Handle TOTP verification via Better Auth client
  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await twoFactor.verifyTotp({ code: totpCode, trustDevice });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired TOTP code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle backup recovery code verification via Better Auth client
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim()) {
      toast({
        title: "Recovery Code Required",
        description: "Please enter a recovery code.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await twoFactor.verifyBackupCode({
        code: recoveryCode.trim(),
        trustDevice,
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid recovery code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebAuthnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const options = await getAuthenticationOptions.mutateAsync();
      const asseResp = await startAuthentication({ optionsJSON: options });
      await verifyAuthentication.mutateAsync(asseResp as any);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify authenticator.",
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
                Security Key
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
              <form onSubmit={handleTotpSubmit} className="space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="totp-code">Authentication Code</Label>
                  <Input
                    id="totp-code"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) =>
                      setTotpCode(e.target.value.replace(/\D/g, ""))
                    }
                    className="text-center text-2xl tracking-widest"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="trust-device-totp"
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="trust-device-totp" className="text-sm">
                    Trust this device for 30 days
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || totpCode.length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="webauthn" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Use your security key or biometric to sign in
              </div>
              <form onSubmit={handleWebAuthnSubmit} className="space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Use Security Key"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="recovery" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Enter one of your backup recovery codes
              </div>
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="recovery-code">Recovery Code</Label>
                  <Input
                    id="recovery-code"
                    type="text"
                    placeholder="xxxxxxxx"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="text-center font-mono"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="trust-device-recovery"
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="trust-device-recovery" className="text-.tsx">
                    Trust this device for 30 days
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !recoveryCode.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Recovery Code"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            Having trouble?{" "}
            <a href="/auth/login" className="underline">
              Back to sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
