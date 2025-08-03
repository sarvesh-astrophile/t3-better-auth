"use client";

import { useState, useEffect } from "react";
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
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";

export function VerifyEmailForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const token = searchParams.get("token");
  const autoVerify = searchParams.get("verify") === "true";

  const verifyEmailMutation = api.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setVerificationStatus("success");
      toast({
        title: "Email Verified",
        description: "Your email has been verified successfully!",
      });
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    },
    onError: (error) => {
      setVerificationStatus("error");
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendVerificationMutation = api.auth.sendVerificationEmail.useMutation({
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Verification email sent successfully! Check your inbox.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-verify if token is present
  useEffect(() => {
    if (token && (autoVerify || verificationStatus === "idle")) {
      setIsVerifying(true);
      verifyEmailMutation.mutate({
        token,
        callbackURL: "/dashboard",
      });
    }
  }, [token, autoVerify, verificationStatus]);

  const handleResendVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    sendVerificationMutation.mutate({
      email,
      callbackURL: "/dashboard",
    });
  };

  if (token) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Email Verification</CardTitle>
            <CardDescription>
              {isVerifying || verifyEmailMutation.isPending
                ? "Verifying your email address..."
                : verificationStatus === "success"
                ? "Email verified successfully!"
                : verificationStatus === "error"
                ? "Verification failed"
                : "Verifying your email address..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              {verifyEmailMutation.isPending ? (
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="size-12 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Please wait while we verify your email...
                  </p>
                </div>
              ) : verificationStatus === "success" ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="size-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-green-600">
                      Email verified successfully!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Redirecting you to the dashboard...
                    </p>
                  </div>
                </div>
              ) : verificationStatus === "error" ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="size-6 text-red-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-red-600">Verification failed</p>
                    <p className="text-sm text-muted-foreground">
                      The verification link may be invalid or expired.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/auth/verify-email")}
                    variant="outline"
                  >
                    Request New Link
                  </Button>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
          <CardDescription>
            Enter your email address to receive a verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Mail className="size-4" />
            <AlertDescription>
              Please check your email for a verification link. If you don't see it,
              check your spam folder or request a new one below.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleResendVerification} className="space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={sendVerificationMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={sendVerificationMutation.isPending}
            >
              {sendVerificationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Verification Email"
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            Already verified?{" "}
            <a href="/auth/login" className="underline underline-offset-4">
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}