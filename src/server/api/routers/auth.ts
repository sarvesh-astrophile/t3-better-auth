import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure, protectedProcedure, verifiedProcedure } from "@/server/api/trpc";
import { auth } from "@/lib/auth";

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(({ ctx }) => {
    return {
      session: ctx.session,
      user: ctx.user,
      isAuthenticated: ctx.isAuthenticated,
      isEmailVerified: ctx.isEmailVerified,
      requiresVerification: ctx.requiresVerification,
    };
  }),

  getUserProfile: verifiedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
      isEmailVerified: ctx.isEmailVerified,
    };
  }),

  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Account created successfully",
        };
      } catch (error) {
        console.error("Signup error:", error);
        
        // Handle specific better-auth errors
        if (error instanceof Error) {
          if (error.message.includes("already exists") || error.message.includes("duplicate")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "An account with this email already exists",
            });
          }
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create account. Please try again.",
        });
      }
    }),

  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await auth.api.signInEmail({
          body: {
            email: input.email,
            password: input.password,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Signed in successfully",
        };
      } catch (error: any) {
        console.error("Sign in error:", error);
        
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
    }),

  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await auth.api.signOut({
        headers: ctx.headers,
      });

      return {
        success: true,
        message: "Signed out successfully",
      };
    } catch (error) {
      console.error("Sign out error:", error);
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to sign out",
      });
    }
  }),

  sendVerificationOTP: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        type: z.enum(['email-verification', 'sign-in', 'forget-password']).default('email-verification'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.sendVerificationOTP({
          body: {
            email: input.email,
            type: input.type,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Verification code sent successfully",
        };
      } catch (error) {
        console.error("Send verification OTP error:", error);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification code",
        });
      }
    }),

  verifyEmailOTP: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        otp: z.string().length(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.verifyEmailOTP({
          body: {
            email: input.email,
            otp: input.otp,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Email verified successfully",
        };
      } catch (error) {
        console.error("Verify email OTP error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification code",
        });
      }
    }),

  // Legacy support - keep for compatibility but deprecate
  sendVerificationEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        callbackURL: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Redirect to OTP flow
        await auth.api.sendVerificationOTP({
          body: {
            email: input.email,
            type: 'email-verification',
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Verification code sent successfully",
        };
      } catch (error) {
        console.error("Send verification email error:", error);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification code",
        });
      }
    }),

  verifyEmail: publicProcedure
    .input(
      z.object({
        token: z.string(),
        callbackURL: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.verifyEmail({
          query: {
            token: input.token,
            callbackURL: input.callbackURL || "/dashboard",
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Email verified successfully",
        };
      } catch (error) {
        console.error("Verify email error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired verification token",
        });
      }
    }),

  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        redirectTo: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.forgetPassword({
          body: {
            email: input.email,
            redirectTo: input.redirectTo || "/auth/reset-password",
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Password reset email sent successfully",
        };
      } catch (error) {
        console.error("Forgot password error:", error);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send password reset email",
        });
      }
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.resetPassword({
          body: {
            token: input.token,
            newPassword: input.newPassword,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Password reset successfully",
        };
      } catch (error) {
        console.error("Reset password error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }
    }),
});