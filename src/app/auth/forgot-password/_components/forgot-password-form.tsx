"use client";

import { useEffect, useRef, useState } from "react";
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
import { Loader2, CheckCircle2, Mail, Eye, EyeOff } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [canResendAt, setCanResendAt] = useState<number>(0);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const { toast } = useToast();
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const sendOtpMutation = api.auth.forgotPasswordEmailOtp.useMutation({
    onSuccess: () => {
      setStep("verify");
      setOTP(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      setCanResendAt(Date.now() + 60_000);
      toast({
        title: "Code Sent",
        description: "We sent a 6-digit code to your email.",
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

  const resetWithOtpMutation = api.auth.resetPasswordEmailOtp.useMutation({
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Your password has been reset successfully.",
      });
      window.location.href = "/auth/login";
    },
    onError: (error) => {
      setOTP(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    sendOtpMutation.mutate({ email });
  };

  const handleOTPChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length > 1) {
      // Handle paste of multiple digits
      const digits = v.slice(0, 6).split("");
      const newOTP = ["", "", "", "", "", ""] as string[];
      for (let i = 0; i < newOTP.length; i++) newOTP[i] = digits[i] || "";
      setOTP(newOTP);
      const next = Math.min(digits.length, 5);
      otpRefs.current[next]?.focus();
      return;
    }
    const newOTP = [...otp];
    newOTP[index] = v;
    setOTP(newOTP);
    if (v && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast({ title: "Invalid Code", description: "Enter the 6-digit code.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Weak Password", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords Don't Match", description: "Confirm your password correctly.", variant: "destructive" });
      return;
    }
    resetWithOtpMutation.mutate({ email, otp: code, newPassword: password });
  };

  const secondsToResend = Math.max(0, Math.ceil((canResendAt - nowTs) / 1000));

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Forgot Password</CardTitle>
          {step === "request" ? (
            <CardDescription>
              Enter your email address and we'll send you a 6-digit code to reset your password
            </CardDescription>
          ) : (
            <CardDescription>
              Enter the 6-digit code we sent to your email and choose a new password
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {step === "request" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="grid gap-3">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={sendOtpMutation.isPending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={sendOtpMutation.isPending}>
                {sendOtpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Send Code"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <Label>Enter Code</Label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="h-12 w-10 text-center"
                      value={digit}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      disabled={resetWithOtpMutation.isPending}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Didn't get the code? {secondsToResend > 0 ? (
                    <span>Resend available in {secondsToResend}s</span>
                  ) : (
                    <button
                      type="button"
                      className="underline underline-offset-4"
                      onClick={() => sendOtpMutation.mutate({ email })}
                      disabled={sendOtpMutation.isPending}
                    >
                      {sendOtpMutation.isPending ? "Sending..." : "Resend code"}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={resetWithOtpMutation.isPending}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="********"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={resetWithOtpMutation.isPending}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirm((s) => !s)}
                  >
                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={resetWithOtpMutation.isPending || otp.join("").length !== 6}
              >
                {resetWithOtpMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                <a
                  href="#"
                  className="underline underline-offset-4"
                  onClick={(e) => {
                    e.preventDefault();
                    setStep("request");
                  }}
                >
                  Use a different email
                </a>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            Remember your password?{" "}
            <a href="/auth/login" className="underline underline-offset-4">
              Sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}