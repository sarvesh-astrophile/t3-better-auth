import { auth } from "@/lib/auth";
import type { Session, User } from "@/lib/auth";

export interface SessionWithVerification {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  requiresVerification: boolean;
}

/**
 * Get session with verification status from headers
 * Use this in server components and API routes
 */
export async function getSessionWithVerification(headers: Headers): Promise<SessionWithVerification> {
  try {
    const sessionData = await auth.api.getSession({ headers });
    
    if (!sessionData?.user) {
      return {
        user: null,
        session: null,
        isAuthenticated: false,
        isEmailVerified: false,
        requiresVerification: false,
      };
    }

    const isEmailVerified = sessionData.user.emailVerified ?? false;
    
    return {
      user: sessionData.user,
      session: sessionData.session,
      isAuthenticated: true,
      isEmailVerified,
      requiresVerification: !isEmailVerified,
    };
  } catch (error) {
    console.error("Failed to get session:", error);
    return {
      user: null,
      session: null,
      isAuthenticated: false,
      isEmailVerified: false,
      requiresVerification: false,
    };
  }
}

/**
 * Check if a user needs email verification
 */
export function needsEmailVerification(user: User | null): boolean {
  if (!user) return false;
  return !user.emailVerified;
}

/**
 * Check if a route requires email verification
 */
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    "/dashboard",
    "/profile", 
    "/settings",
    // Add more protected routes as needed
  ];
  
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is a verification-related route
 */
export function isVerificationRoute(pathname: string): boolean {
  const verificationRoutes = [
    "/auth/verify-otp",
    "/auth/verification-pending",
    "/auth/verify-email", // Legacy support
  ];
  
  return verificationRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is an auth route that should redirect verified users
 */
export function isAuthRoute(pathname: string): boolean {
  const authRoutes = [
    "/auth/login",
    "/auth/signup",
  ];
  
  return authRoutes.includes(pathname);
}

/**
 * Get the appropriate redirect URL for unverified users
 */
export function getVerificationRedirectUrl(email?: string): string {
  const baseUrl = "/auth/verify-otp";
  if (email) {
    return `${baseUrl}?email=${encodeURIComponent(email)}`;
  }
  return baseUrl;
}

/**
 * Get verification status from user object
 */
export function getVerificationStatus(user: User | null): {
  isVerified: boolean;
  canAccessProtected: boolean;
  shouldRedirectToVerification: boolean;
} {
  if (!user) {
    return {
      isVerified: false,
      canAccessProtected: false,
      shouldRedirectToVerification: false,
    };
  }

  const isVerified = user.emailVerified ?? false;
  
  return {
    isVerified,
    canAccessProtected: isVerified,
    shouldRedirectToVerification: !isVerified,
  };
}

/**
 * Create a session response with verification metadata
 */
export function createSessionResponse(sessionData: SessionWithVerification) {
  return {
    user: sessionData.user,
    session: sessionData.session,
    isAuthenticated: sessionData.isAuthenticated,
    isEmailVerified: sessionData.isEmailVerified,
    requiresVerification: sessionData.requiresVerification,
    verificationStatus: sessionData.user ? getVerificationStatus(sessionData.user) : null,
  };
}

/**
 * Types for unverified user session management
 */
export interface UnverifiedUserSession {
  email: string;
  name?: string;
  tempSessionId: string;
  createdAt: Date;
  lastLoginAttempt?: Date;
}

/**
 * Store unverified user attempt in database
 */
export async function storeUnverifiedLoginAttempt(
  email: string, 
  hashedPassword: string, 
  name?: string
): Promise<void> {
  // This would typically use your database client
  // For now, we'll handle this in the tRPC mutation
  console.log("Storing unverified login attempt for:", email);
}

/**
 * Clean up old unverified login attempts (older than 24 hours)
 */
export async function cleanupOldUnverifiedAttempts(): Promise<void> {
  // This would clean up old records from the database
  console.log("Cleaning up old unverified login attempts");
}

/**
 * Session validation utilities
 */
export const SessionValidation = {
  /**
   * Validate if session allows access to a specific route
   */
  canAccessRoute: (session: SessionWithVerification, pathname: string): boolean => {
    // Unauthenticated users can't access protected routes
    if (!session.isAuthenticated && isProtectedRoute(pathname)) {
      return false;
    }
    
    // Unverified users can't access protected routes
    if (session.isAuthenticated && !session.isEmailVerified && isProtectedRoute(pathname)) {
      return false;
    }
    
    return true;
  },

  /**
   * Get redirect URL based on session and current route
   */
  getRedirectUrl: (session: SessionWithVerification, pathname: string): string | null => {
    // Unauthenticated users accessing protected routes → login
    if (!session.isAuthenticated && isProtectedRoute(pathname)) {
      return "/auth/login";
    }
    
    // Authenticated but unverified users accessing protected routes → verification
    if (session.isAuthenticated && !session.isEmailVerified && isProtectedRoute(pathname)) {
      return getVerificationRedirectUrl(session.user?.email);
    }
    
    // Authenticated and verified users on auth pages → dashboard
    if (session.isAuthenticated && session.isEmailVerified && isAuthRoute(pathname)) {
      return "/dashboard";
    }
    
    // Authenticated and verified users on verification pages → dashboard
    if (session.isAuthenticated && session.isEmailVerified && isVerificationRoute(pathname)) {
      return "/dashboard";
    }
    
    // Authenticated but unverified users on auth pages → verification
    if (session.isAuthenticated && !session.isEmailVerified && isAuthRoute(pathname)) {
      return getVerificationRedirectUrl(session.user?.email);
    }
    
    return null;
  },
};