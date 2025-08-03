"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import { Loader2, Mail, CheckCircle2, AlertTriangle } from "lucide-react";

export function VerificationPendingForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [isResent, setIsResent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get email from URL params if available
  const emailFromParams = searchParams.get("email");
  const userEmail = emailFromParams || email;

  const resendVerificationMutation = api.auth.sendVerificationOTP.useMutation({
    onSuccess: () => {
      setIsResent(true);
      toast({
        title: "Code Sent",
        description: "Verification code sent successfully! Check your inbox.",
      });
      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(userEmail)}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    resendVerificationMutation.mutate({
      email: userEmail,
      type: 'email-verification',
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
          <CardDescription>
            We'll send you a 6-digit verification code to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="size-6 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-medium">Email Verification Required</p>
              <p className="text-sm text-muted-foreground">
                {userEmail ? (
                  <>We'll send a verification code to <span className="font-medium text-foreground">{userEmail}</span></>
                ) : (
                  "Enter your email address to receive a verification code"
                )}
              </p>
            </div>
          </div>

          {!isResent ? (
            <Alert>
              <AlertTriangle className="size-4" />
              <AlertDescription>
                You must verify your email address before you can sign in to your account.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                Verification code sent! You'll be redirected to enter the code.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Ready to verify your email? Click below to get your verification code.</p>
            </div>

            <form onSubmit={handleResendVerification} className="space-y-4">
              {!emailFromParams && (
                <div className="grid gap-3">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={resendVerificationMutation.isPending}
                  />
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={resendVerificationMutation.isPending}
                >
                  {resendVerificationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push("/auth/login")}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="text-center">
              <p className="font-medium">How it works:</p>
              <ul className="mt-2 space-y-1">
                <li>• We'll send a 6-digit code to your email</li>
                <li>• Enter the code on the verification page</li>
                <li>• Verification codes expire in 5 minutes</li>
              </ul>
            </div>
          </div>

          <div className="text-center text-sm">
            Wrong email address?{" "}
            <a href="/auth/signup" className="underline underline-offset-4">
              Sign up with a different email
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}