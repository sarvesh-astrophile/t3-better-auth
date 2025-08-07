import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { auth } from "@/lib/auth";
import { TRPCError } from "@trpc/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import { db } from "@/server/db";

const rpID = process.env.NEXT_PUBLIC_APP_URL?.replace("http://", "").replace(
  "https://",
  "",
) ?? "localhost";
const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const origin = `${protocol}://${rpID}`;

export const webauthnRouter = createTRPCRouter({
  getRegistrationOptions: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;

      const existingAuthenticators = await db.authenticator.findMany({
        where: { userId: user.id },
      });

      const options = await generateRegistrationOptions({
        rpName: "Better Auth T3",
        rpID,
        userID: Buffer.from(user.id, "utf-8"),
        userName: user.email,
        userDisplayName: input.name,
        attestationType: "none",
        excludeCredentials: existingAuthenticators.map((auth) => ({
          id: auth.credentialID,
          type: "public-key",
          transports: auth.transports?.split(",") as any,
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          authenticatorAttachment: "platform",
        },
      });

      await db.user.update({
        where: { id: user.id },
        data: {
          currentChallenge: options.challenge,
        },
      });

      return options;
    }),

  verifyRegistration: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        response: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.findUnique({ where: { id: ctx.user.id } });
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const body = input.response as RegistrationResponseJSON;

      const challenge = user.currentChallenge;
      if (!challenge) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No challenge found for user",
        });
      }

      let verification: VerifiedRegistrationResponse;
      try {
        verification = await verifyRegistrationResponse({
          response: body,
          expectedChallenge: challenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          requireUserVerification: true,
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify registration",
        });
      }

      const { verified, registrationInfo } = verification;

      if (verified && registrationInfo) {
        const {
          credential,
          credentialDeviceType,
          credentialBackedUp,
        } = registrationInfo;
        const {
          publicKey: credentialPublicKey,
          id: credentialID,
          counter,
        } = credential;
        await db.authenticator.create({
          data: {   
            name: input.name,
            userId: user.id,
            credentialID: Buffer.from(credentialID).toString("base64url"),
            credentialPublicKey: Buffer.from(credentialPublicKey),
            counter: BigInt(counter),
            credentialBackedUp,
            credentialDeviceType,
            transports: body.response.transports?.join(","),
          },
        });
      }

      await db.user.update({
        where: { id: user.id },
        data: {
          currentChallenge: null,
        },
      });

      return { verified };
    }),

  getAuthenticationOptions: publicProcedure.mutation(async () => {
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
    });

    await db.user.updateMany({ data: { currentChallenge: options.challenge } });

    return options;
  }),

  verifyAuthentication: publicProcedure
    .input(z.any())
    .mutation(async ({ input }) => {    
      const body = input as AuthenticationResponseJSON;

      const authenticator = await db.authenticator.findUnique({
        where: { credentialID: body.id },
        include: { user: true },
      });

      if (!authenticator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Authenticator not found",
        });
      }

      const challenge = authenticator.user.currentChallenge;
      if (!challenge) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No challenge found for user",
        });
      }

      let verification;
      try {
        const authenticatorData = {
          id: authenticator.credentialID,
          publicKey: authenticator.credentialPublicKey,
          counter: Number(authenticator.counter),
          transports: authenticator.transports?.split(",") as any,
        };

        verification = await verifyAuthenticationResponse({
          response: body,
          expectedChallenge: challenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          credential: authenticatorData,
          requireUserVerification: true,
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify authentication",
        });
      }

      if (!verification.verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Could not verify authenticator",
        });
      }

      await db.authenticator.update({
        where: { id: authenticator.id },
        data: { counter: BigInt(verification.authenticationInfo.newCounter) },
      });

      await db.user.update({
        where: { id: authenticator.userId },
        data: { currentChallenge: null },
      });

      return { verified: true };
    }),

  listAuthenticators: protectedProcedure.query(async ({ ctx }) => {
    const authenticators = await db.authenticator.findMany({
      where: { userId: ctx.user.id },
    });
    return authenticators;
  }),

  removeAuthenticator: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.authenticator.delete({
        where: { id: input.id, userId: ctx.user.id },
      });
      return { success: true };
    }),
});
