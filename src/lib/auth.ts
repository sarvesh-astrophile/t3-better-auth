import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, oneTap, twoFactor } from "better-auth/plugins";
import { passkey } from "better-auth/plugins/passkey";
import { db } from "@/server/db";
import { env } from "@/env";
import { sendOTPEmail, sendPasswordResetEmail } from "@/lib/email";



export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  // Built-in Better Auth rate limiting. Note: this applies to client hits on /api/auth/*.
  // Our server-side tRPC calls via auth.api are exempt, so we also add a tRPC middleware below.
  rateLimit: {
    enabled: true,
    // default window and max for non-sensitive endpoints
    window: 60, // seconds
    max: 100,
    // tighter limits for sensitive routes
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/email-otp/verify-email": { window: 30, max: 5 },
      "/forget-password/email-otp": { window: 60, max: 3 },
      "/email-otp/reset-password": { window: 60, max: 5 },
      "/two-factor/*": async () => ({ window: 30, max: 5 }),
      "/sign-in/email": { window: 10, max: 3 },
    },
    // storage: "memory" // default; can be switched to "database" when needed
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Allow unverified users to login but restrict access via middleware
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendPasswordResetEmail({
        to: user.email,
        url,
        token,
      });
    },
  },
  appName: "Better Auth T3", // Used as issuer for TOTP
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true, // Replace link-based verification with OTP
      otpLength: 6, // 6-digit OTP
      expiresIn: 300, // 5 minutes expiry
      allowedAttempts: 3, // Allow 3 verification attempts
      
      // Ensure session persistence during verification flow
      disableSignUp: false, // Allow signup with email verification
      
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTPEmail({
          to: email,
          otp,
          type,
        });
      },
    }),
    oneTap({
      // Enable Google One Tap authentication
      disableSignup: false, // Allow new users to sign up via One Tap
    }),
    passkey({
      rpName: "Better Auth T3",
      rpID: env.RP_ID!,
      origin: (env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, ""),
      authenticatorSelection: {
        authenticatorAttachment: undefined, // Allow both platform and cross-platform
        userVerification: "preferred",
        residentKey: "preferred",
      },
    }),
    twoFactor({
      // TOTP configuration
      totpOptions: {
        digits: 6, // 6-digit codes
        period: 30, // 30-second validity
      },
      // OTP configuration for email-based 2FA (fallback)
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendOTPEmail({
            to: user.email,
            otp,
            type: 'two-factor',
          });
        },
        period: 300, // 5 minutes validity for email OTP
      },
      // Backup codes configuration
      backupCodeOptions: {
        amount: 10, // Generate 10 backup codes
        length: 8,  // 8-character backup codes
      },
      issuer: "Better Auth T3", // App name for authenticator apps
    }),
  ],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID!,
      clientSecret: env.GOOGLE_CLIENT_SECRET!,
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "https://bristol-frankfurt-toolkit-shock.trycloudflare.com",
    "http://bristol-frankfurt-toolkit-shock.trycloudflare.com",
  ],
  secret: env.BETTER_AUTH_SECRET || env.AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",
  logger: {
    level: env.NODE_ENV === "development" ? "debug" : "error",
  },
  advanced: {
    // Change the prefix for all cookies (default: "better-auth")
    cookiePrefix: "auth",
    
    // Set global default attributes for all cookies
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", // Ensure cookies are available across the entire domain
    },
    
    // Force secure cookies (useful for production)
    useSecureCookies: env.NODE_ENV === "production",
    // Ensure correct client IP detection for rate limiting behind proxies/CDNs
    ipAddress: {
      ipAddressHeaders: [
        "cf-connecting-ip",
        "x-forwarded-for",
        "x-real-ip",
      ],
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;