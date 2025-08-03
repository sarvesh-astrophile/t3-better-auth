"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVerificationStatus } from "@/components/verification-guard";
import { CheckCircle2, AlertTriangle, Mail, RefreshCw } from "lucide-react";
import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface VerificationStatusProps {
  className?: string;
  showActions?: boolean;
  variant?: "default" | "compact" | "banner";
}

/**
 * Component that displays the user's email verification status
 * Can be used in headers, dashboards, or anywhere verification status is relevant
 */
export function VerificationStatus({ 
  className, 
  showActions = true,
  variant = "default" 
}: VerificationStatusProps) {
  const { isLoading, isAuthenticated, isEmailVerified, user } = useVerificationStatus();
  const { toast } = useToast();
  const router = useRouter();

  const sendVerificationMutation = api.auth.sendVerificationOTP.useMutation({
    onSuccess: () => {
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code.",
      });
      router.push(`/auth/verify-otp?email=${encodeURIComponent(user?.email || '')}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Don't show anything if loading or not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  const handleSendVerification = () => {
    if (!user?.email) return;
    
    sendVerificationMutation.mutate({
      email: user.email,
      type: 'email-verification',
    });
  };

  const handleVerifyNow = () => {
    const verificationUrl = user?.email 
      ? `/auth/verify-otp?email=${encodeURIComponent(user.email)}`
      : '/auth/verify-otp';
    router.push(verificationUrl);
  };

  if (variant === "compact") {
    return (
      <div className={className}>
        {isEmailVerified ? (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        ) : (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Unverified
          </Badge>
        )}
      </div>
    );
  }

  if (variant === "banner" && !isEmailVerified) {
    return (
      <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center justify-between">
            <span>
              Please verify your email address to access all features.
            </span>
            {showActions && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleVerifyNow}
                className="ml-4 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                Verify Now
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmailVerified) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Email Verified</span>
              <br />
              <span className="text-sm">
                Your email address {user?.email} has been verified.
              </span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Default unverified state
  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <Mail className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Email Verification Required</span>
            <br />
            <span className="text-sm">
              Please verify {user?.email} to access all features.
            </span>
          </div>
          {showActions && (
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSendVerification}
                disabled={sendVerificationMutation.isPending}
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                {sendVerificationMutation.isPending ? (
                  <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Mail className="w-3 h-3 mr-1" />
                )}
                Send Code
              </Button>
              <Button
                size="sm"
                onClick={handleVerifyNow}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Verify Now
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Simplified verification badge for headers/nav
 */
export function VerificationBadge({ className }: { className?: string }) {
  return <VerificationStatus variant="compact" showActions={false} className={className} />;
}

/**
 * Banner version for top of pages
 */
export function VerificationBanner({ className }: { className?: string }) {
  return <VerificationStatus variant="banner" className={className} />;
}