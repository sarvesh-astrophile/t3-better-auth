"use client";

import { GoogleOneTap } from "@/components/google-one-tap";
import { usePathname } from "next/navigation";

/**
 * Auth Provider component that wraps authentication-related components
 * This component provides global auth features like Google One Tap
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show One Tap on certain pages where it might interfere
  const excludedPaths = [
    '/auth/verify-otp',
    '/auth/verification-pending',
    '/auth/2fa'
  ];
  
  const shouldShowOneTap = !excludedPaths.some(path => pathname.startsWith(path));

  return (
    <>
      {children}
      {shouldShowOneTap && (
        <GoogleOneTap 
          restrictToAuthPages={true}
          callbackURL="/dashboard"
          autoSelect={false}
        />
      )}
    </>
  );
}