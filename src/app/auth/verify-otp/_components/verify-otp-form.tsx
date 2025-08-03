"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, CheckCircle2, AlertCircle, Mail, RefreshCw } from "lucide-react";

export function VerifyOTPForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [canResend, setCanResend] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const emailFromParams = searchParams.get("email");
  const userEmail = emailFromParams || email;
  
  // References for OTP inputs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyOTPMutation = api.auth.verifyEmailOTP.useMutation({
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
      // Clear OTP fields on error
      setOTP(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    },
  });

  const sendOTPMutation = api.auth.sendVerificationOTP.useMutation({
    onSuccess: () => {
      toast({
        title: "Code Sent",
        description: "Verification code sent successfully! Check your inbox.",
      });
      setTimeLeft(300); // Reset timer
      setCanResend(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    otpRefs.current[0]?.focus();
  }, []);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6);
      const newOTP = [...otp];
      for (let i = 0; i < pastedCode.length && i < 6; i++) {
        newOTP[i] = pastedCode[i];
      }
      setOTP(newOTP);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedCode.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    verifyOTPMutation.mutate({
      email: userEmail,
      otp: otpCode,
    });
  };

  const handleResendOTP = () => {
    if (!userEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    sendOTPMutation.mutate({
      email: userEmail,
      type: 'email-verification',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (verificationStatus === "success") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been verified successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            Enter the 6-digit code sent to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-100">
              <Mail className="size-6 text-blue-600" />
            </div>
            {userEmail && (
              <p className="text-sm text-muted-foreground text-center">
                We've sent a verification code to{" "}
                <span className="font-medium text-foreground">{userEmail}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
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
                  disabled={verifyOTPMutation.isPending}
                />
              </div>
            )}

            <div className="grid gap-3">
              <Label>Verification Code</Label>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6} // Allow paste
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-mono"
                    disabled={verifyOTPMutation.isPending}
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={verifyOTPMutation.isPending || otp.join("").length !== 6}
            >
              {verifyOTPMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              {timeLeft > 0 ? (
                <span className="text-muted-foreground">
                  Code expires in {formatTime(timeLeft)}
                </span>
              ) : (
                <span className="text-red-600 font-medium">Code expired</span>
              )}
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOTP}
                disabled={!canResend || sendOTPMutation.isPending}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                {sendOTPMutation.isPending ? (
                  <RefreshCw className="mr-1 size-3 animate-spin" />
                ) : (
                  "Resend code"
                )}
              </Button>
            </div>

            <Alert>
              <AlertCircle className="size-4" />
              <AlertDescription>
                Didn't receive the code? Check your spam folder or try resending.
              </AlertDescription>
            </Alert>
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