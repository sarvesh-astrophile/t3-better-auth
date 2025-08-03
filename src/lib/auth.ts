import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
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
    requireEmailVerification: true, // Enable email verification
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendPasswordResetEmail({
        to: user.email,
        url,
        token,
      });
    },
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true, // Replace link-based verification with OTP
      otpLength: 6, // 6-digit OTP
      expiresIn: 300, // 5 minutes expiry
      allowedAttempts: 3, // Allow 3 verification attempts
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTPEmail({
          to: email,
          otp,
          type,
        });
      },
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
    },
    
    // Force secure cookies (useful for production)
    useSecureCookies: env.NODE_ENV === "production",
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;