"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/trpc/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

interface VerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectToVerification?: boolean;
}

/**
 * Component that protects routes and ensures only verified users can access the content
 * Automatically redirects unverified users or shows a verification prompt
 */
export function VerificationGuard({ 
  children, 
  fallback,
  redirectToVerification = true 
}: VerificationGuardProps) {
  const router = useRouter();
  const { data: session, isLoading, error } = api.auth.getSession.useQuery();

  useEffect(() => {
    if (isLoading) return;

    // If user is not authenticated, let the main auth guard handle it
    if (!session?.isAuthenticated) return;

    // If user is authenticated but not verified and auto-redirect is enabled
    if (session.isAuthenticated && !session.isEmailVerified && redirectToVerification) {
      const verificationUrl = `/auth/verify-otp?email=${encodeURIComponent(session.user?.email || '')}`;
      router.push(verificationUrl);
    }
  }, [session, isLoading, router, redirectToVerification]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load session. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Not authenticated - let main auth system handle this
  if (!session?.isAuthenticated) {
    return <>{children}</>;
  }

  // Authenticated but not verified
  if (session.isAuthenticated && !session.isEmailVerified) {
    // If auto-redirect is disabled, show fallback or default verification prompt
    if (!redirectToVerification) {
      return fallback || <DefaultVerificationPrompt email={session.user?.email} />;
    }
    
    // Show loading while redirecting
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Redirecting to email verification...</p>
        </div>
      </div>
    );
  }

  // Authenticated and verified - show protected content
  return <>{children}</>;
}

/**
 * Default verification prompt shown when redirectToVerification is false
 */
function DefaultVerificationPrompt({ email }: { email?: string }) {
  const router = useRouter();

  const handleVerifyClick = () => {
    const verificationUrl = email 
      ? `/auth/verify-otp?email=${encodeURIComponent(email)}`
      : '/auth/verify-otp';
    router.push(verificationUrl);
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-yellow-100 mx-auto">
          <Mail className="size-8 text-yellow-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Email Verification Required</h2>
          <p className="text-muted-foreground">
            You need to verify your email address to access this page.
          </p>
          {email && (
            <p className="text-sm text-muted-foreground">
              We'll send a verification code to <span className="font-medium">{email}</span>
            </p>
          )}
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please verify your email address to continue using all features of the application.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button onClick={handleVerifyClick} className="w-full">
            Verify Email Address
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/auth/login')}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to get verification status
 */
export function useVerificationStatus() {
  const { data: session, isLoading, error } = api.auth.getSession.useQuery();

  return {
    isLoading,
    error,
    isAuthenticated: session?.isAuthenticated ?? false,
    isEmailVerified: session?.isEmailVerified ?? false,
    requiresVerification: session?.requiresVerification ?? false,
    user: session?.user ?? null,
  };
}

/**
 * Higher-order component for protecting routes
 */
export function withVerificationGuard<T extends object>(
  Component: React.ComponentType<T>,
  options: Omit<VerificationGuardProps, 'children'> = {}
) {
  return function VerificationProtectedComponent(props: T) {
    return (
      <VerificationGuard {...options}>
        <Component {...props} />
      </VerificationGuard>
    );
  };
}