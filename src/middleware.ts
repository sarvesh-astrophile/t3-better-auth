import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes (except auth API)
  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon.ico")) {
    return NextResponse.next();
  }
  
  // Get session data from cookies (Edge Runtime compatible)
  // Try different possible cookie names for Better Auth
  const sessionCookie = request.cookies.get("auth.session_token") || 
                        request.cookies.get("auth.session-token") ||
                        request.cookies.get("better-auth.session-token") ||
                        request.cookies.get("auth.session");
  const userCookie = request.cookies.get("auth.user") || 
                     request.cookies.get("better-auth.user");
  
  // Debug logging in development
  if (process.env.NODE_ENV === "development") {
    console.log("🍪 Middleware Debug:", {
      path: pathname,
      sessionCookie: sessionCookie?.value ? "present" : "missing",
      userCookie: userCookie?.value ? "present" : "missing",
      allCookies: request.cookies.getAll().map(c => c.name),
    });
  }
  
  // More permissive authentication check - just need a session cookie
  const isAuthenticated = !!sessionCookie?.value;
  let isEmailVerified = null; // null = unknown, let backend decide
  let userEmail = "";
  
  if (isAuthenticated) {
    // Try to get verification status from user cookie
    if (userCookie?.value) {
      try {
        const userData = JSON.parse(userCookie.value);
        isEmailVerified = userData?.emailVerified ?? false;
        userEmail = userData?.email ?? "";
        
        if (process.env.NODE_ENV === "development") {
          console.log("🔍 User Data:", {
            email: userData?.email,
            emailVerified: userData?.emailVerified,
            isEmailVerified,
          });
        }
      } catch (error) {
        // If parsing fails, let the backend handle verification check
        isEmailVerified = null;
        if (process.env.NODE_ENV === "development") {
          console.log("❌ Cookie parsing error, letting backend decide:", error);
        }
      }
    } else {
      // No user cookie, let the backend handle verification check
      isEmailVerified = null;
      if (process.env.NODE_ENV === "development") {
        console.log("🚨 No user cookie found, letting backend decide");
      }
    }
  }
  
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
    // Only make redirects when we're confident about verification status
    
    // Redirect verified users away from auth pages to dashboard
    if (isEmailVerified === true && isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Redirect definitely unverified users from protected routes to verification
    if (isEmailVerified === false && isProtectedRoute) {
      const verificationUrl = userEmail 
        ? `/auth/verify-otp?email=${encodeURIComponent(userEmail)}`
        : '/auth/verify-otp';
      return NextResponse.redirect(new URL(verificationUrl, request.url));
    }
    
    // Redirect verified users away from verification pages
    if (isEmailVerified === true && isVerificationRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // Redirect definitely unverified users from auth routes to verification
    if (isEmailVerified === false && isAuthRoute) {
      const verificationUrl = userEmail 
        ? `/auth/verify-otp?email=${encodeURIComponent(userEmail)}`
        : '/auth/verify-otp';
      return NextResponse.redirect(new URL(verificationUrl, request.url));
    }
    
    // If verification status is unknown (null), let the request through
    // The backend components (dashboard, tRPC) will handle verification checks
    if (process.env.NODE_ENV === "development" && isEmailVerified === null) {
      console.log("🤷 Unknown verification status, letting backend decide for:", pathname);
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