import { NextRequest, NextResponse } from "next/server";
import { getCookieCache } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes (except auth API)
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }
  
  // Get full session data to check authentication and verification status
  const session = await getCookieCache(request);
  const isAuthenticated = !!session?.user;
  const isEmailVerified = session?.user?.emailVerified ?? false;
  
  // Define protected routes that require authentication
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Define auth routes that authenticated users shouldn't access
  const authRoutes = ["/auth/login", "/auth/signup"];
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Define verification routes that unverified users can access
  const verificationRoutes = ["/auth/verify-otp", "/auth/verification-pending"];
  const isVerificationRoute = verificationRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users from protected pages to login
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Handle authenticated users
  if (isAuthenticated) {
    // Redirect verified users away from auth pages to dashboard
    if (isEmailVerified && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Redirect unverified users from protected routes to verification
    if (!isEmailVerified && isProtectedRoute) {
      const verificationUrl = `/auth/verify-otp?email=${encodeURIComponent(session.user.email)}`;
      return NextResponse.redirect(new URL(verificationUrl, request.url));
    }
    
    // Redirect verified users away from verification pages
    if (isEmailVerified && isVerificationRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Allow unverified users to access auth routes (except login/signup) and verification routes
    if (!isEmailVerified && isAuthRoute) {
      const verificationUrl = `/auth/verify-otp?email=${encodeURIComponent(session.user.email)}`;
      return NextResponse.redirect(new URL(verificationUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/signup", 
    "/auth/verify-otp",
    "/auth/verification-pending",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};