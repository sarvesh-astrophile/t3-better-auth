"use client";

import { useEmailVerification } from "@/hooks/use-email-verification";

/**
 * Component wrapper that automatically redirects unverified users
 * Use this to wrap components that require email verification
 */
export function withEmailVerification<T extends object>(
  Component: React.ComponentType<T>
) {
  return function VerifiedComponent(props: T) {
    const { isVerified, isLoading } = useEmailVerification();

    // Show loading state while checking verification
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Only render component if user is verified
    if (!isVerified) {
      return null; // Redirect happens in useEmailVerification hook
    }

    return <Component {...props} />;
  };
}