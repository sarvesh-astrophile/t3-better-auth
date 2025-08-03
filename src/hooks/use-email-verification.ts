import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";

/**
 * Hook to check email verification status and redirect if needed
 * Use this in client components that need to enforce email verification
 */
export function useEmailVerification() {
  const router = useRouter();
  const { data: session, isLoading } = api.auth.getSession.useQuery();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // If user is authenticated but email is not verified, redirect to verification page
    if (session?.user && !session.user.emailVerified) {
      const verificationUrl = `/auth/verification-pending?email=${encodeURIComponent(session.user.email)}`;
      router.push(verificationUrl);
    }
  }, [session, isLoading, router]);

  return {
    isVerified: session?.user?.emailVerified ?? false,
    isLoading,
    user: session?.user,
  };
}

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