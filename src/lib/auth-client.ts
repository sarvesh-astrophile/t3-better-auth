"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient, oneTapClient, twoFactorClient } from "better-auth/client/plugins";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    emailOTPClient(),
    oneTapClient({
      clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      // Optional client configuration:
      autoSelect: false, // Don't auto-select if only one account
      cancelOnTapOutside: true, // Cancel when clicking outside
      context: "signin", // Context for the One Tap
      // Configure prompt behavior and exponential backoff:
      promptOptions: {
        baseDelay: 1000,   // Base delay in ms (default: 1000)
        maxAttempts: 5     // Maximum number of attempts before triggering onPromptNotification (default: 5)
      }
    }),
    twoFactorClient({
      onTwoFactorRedirect() {
        // Redirect to 2FA verification page when needed
        window.location.href = "/auth/2fa/verify-2fa";
      },
    }),
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
  oneTap,
  twoFactor,
} = authClient;