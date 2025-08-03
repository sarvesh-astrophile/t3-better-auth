"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { env } from "@/env";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    emailOTPClient(),
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;