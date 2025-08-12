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
        // Additional server-side check to prevent verified users from requesting new codes
        if (ctx.isAuthenticated && ctx.isEmailVerified && input.type === 'email-verification') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Your email is already verified",
          });
        }

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
        
        // Handle specific better-auth errors
        if (error instanceof Error) {
          if (error.message.includes("already verified") || error.message.includes("verified")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Your email is already verified",
            });
          }
        }
        
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
        // Additional server-side check to prevent verified users from verifying again
        if (ctx.isAuthenticated && ctx.isEmailVerified) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Your email is already verified",
          });
        }

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
        
        // Handle specific better-auth errors
        if (error instanceof Error) {
          if (error.message.includes("already verified") || error.message.includes("verified")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Your email is already verified",
            });
          }
        }
        
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

  // OTP-based password reset (email)
  forgotPasswordEmailOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.forgetPasswordEmailOTP({
          body: {
            email: input.email,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Verification code sent to your email",
        };
      } catch (error) {
        console.error("Forgot password (OTP) error:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification code",
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

  // Complete OTP-based password reset
  resetPasswordEmailOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        otp: z.string().length(6),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.resetPasswordEmailOTP({
          body: {
            email: input.email,
            otp: input.otp,
            password: input.newPassword,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Password reset successfully",
        };
      } catch (error) {
        console.error("Reset password (OTP) error:", error);

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired code",
        });
      }
    }),

  // Two-Factor Authentication endpoints
  enableTwoFactor: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        issuer: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await auth.api.enableTwoFactor({
          body: {
            password: input.password,
            issuer: input.issuer,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Two-factor authentication setup initiated",
          data: result,
        };
      } catch (error) {
        console.error("Enable 2FA error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to enable two-factor authentication. Please check your password.",
        });
      }
    }),

  disableTwoFactor: protectedProcedure
    .input(
      z.object({
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.disableTwoFactor({
          body: {
            password: input.password,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Two-factor authentication disabled successfully",
        };
      } catch (error) {
        console.error("Disable 2FA error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to disable two-factor authentication. Please check your password.",
        });
      }
    }),

  getTotpUri: protectedProcedure
    .input(
      z.object({
        password: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const result = await auth.api.getTOTPURI({
          body: {
            password: input.password,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("Get TOTP URI error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to get TOTP URI. Please check your password.",
        });
      }
    }),

  verifyTotp: publicProcedure
    .input(
      z.object({
        code: z.string().length(6),
        trustDevice: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.verifyTOTP({
          body: {
            code: input.code,
            trustDevice: input.trustDevice,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "TOTP code verified successfully",
        };
      } catch (error) {
        console.error("Verify TOTP error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired TOTP code",
        });
      }
    }),

  sendTwoFactorOtp: protectedProcedure
    .input(
      z.object({
        trustDevice: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.sendTwoFactorOTP({
          body: {
            trustDevice: input.trustDevice,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Two-factor OTP sent successfully",
        };
      } catch (error) {
        console.error("Send 2FA OTP error:", error);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send two-factor OTP",
        });
      }
    }),

  verifyTwoFactorOtp: publicProcedure
    .input(
      z.object({
        code: z.string(),
        trustDevice: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.verifyTwoFactorOTP({
          body: {
            code: input.code,
            trustDevice: input.trustDevice,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Two-factor OTP verified successfully",
        };
      } catch (error) {
        console.error("Verify 2FA OTP error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired two-factor OTP code",
        });
      }
    }),

  generateBackupCodes: protectedProcedure
    .input(
      z.object({
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await auth.api.generateBackupCodes({
          body: {
            password: input.password,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Backup codes generated successfully",
          data: result,
        };
      } catch (error) {
        console.error("Generate backup codes error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to generate backup codes. Please check your password.",
        });
      }
    }),

  verifyBackupCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        trustDevice: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await auth.api.verifyBackupCode({
          body: {
            code: input.code,
            trustDevice: input.trustDevice,
          },
          headers: ctx.headers,
        });

        return {
          success: true,
          message: "Backup code verified successfully",
        };
      } catch (error) {
        console.error("Verify backup code error:", error);
        
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid backup code",
        });
      }
    }),
});