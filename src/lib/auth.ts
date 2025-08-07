import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, oneTap, twoFactor } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";
import { env } from "@/env";
import { sendOTPEmail, sendPasswordResetEmail } from "@/lib/email";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
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
  trustedOrigins: ["http://localhost:3000"],
  secret: env.AUTH_SECRET,
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
    
    // Database configuration
    database: {
      // Improve session handling during verification flow
      generateId: () => {
        return crypto.randomUUID();
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;