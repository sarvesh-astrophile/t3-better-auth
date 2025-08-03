import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for auth-related pages and static files
  if (pathname.startsWith("/auth/") || pathname.startsWith("/_next/") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  
  // Get session cookie to check if user is authenticated
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "auth"
  });
  const isAuthenticated = !!sessionCookie;

  // Redirect unauthenticated users from protected pages to login
  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && ["/auth/login", "/auth/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/signup",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};