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

    // If user is authenticated but email is not verified, redirect to OTP verification page
    if (session?.user && !session.user.emailVerified) {
      const verificationUrl = `/auth/verify-otp?email=${encodeURIComponent(session.user.email)}`;
      router.push(verificationUrl);
    }
  }, [session, isLoading, router]);

  return {
    isVerified: session?.user?.emailVerified ?? false,
    isLoading,
    user: session?.user,
  };
}

