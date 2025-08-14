/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@/server/db";
import { auth } from "@/lib/auth";
import type { Session, User } from "@/lib/auth";
import { getSessionWithVerification } from "@/lib/session-utils";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
	// Get the session with verification status from better-auth
	const sessionWithVerification = await getSessionWithVerification(opts.headers);
	
	return {
		db,
		session: sessionWithVerification.session,
		user: sessionWithVerification.user,
		isAuthenticated: sessionWithVerification.isAuthenticated,
		isEmailVerified: sessionWithVerification.isEmailVerified,
		requiresVerification: sessionWithVerification.requiresVerification,
		...opts,
	};
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

// Simple in-memory sliding window rate limiter for tRPC procedures
type RateLimitRule = { limit: number; windowMs: number };
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for") || headers.get("cf-connecting-ip") || headers.get("x-real-ip");
  if (!fwd) return "unknown";
  // x-forwarded-for may be a list
  return fwd.split(",")[0]!.trim();
}

function makeKey({ headers }: { headers: Headers }, identifier: string) {
  const ip = getClientIp(headers);
  return `${identifier}:${ip}`;
}

async function applyRateLimit(key: string, rule: RateLimitRule) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return;
  }
  if (entry.count >= rule.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    const error: any = new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests. Please try again later." });
    (error.meta ??= {}).retryAfter = retryAfterSec;
    throw error;
  }
  entry.count += 1;
}

/**
 * Rate limit middleware factory
 */
export const createRateLimitMiddleware = (identifier: string, rule: RateLimitRule) =>
  t.middleware(async ({ ctx, next }) => {
    const key = makeKey(ctx, identifier);
    await applyRateLimit(key, rule);
    return next();
  });

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();

	if (t._config.isDev) {
		// artificial delay in dev
		const waitMs = Math.floor(Math.random() * 400) + 100;
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}

	const result = await next();

	const end = Date.now();
	console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

	return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 * Note: This does NOT check email verification status.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.session || !ctx.user || !ctx.isAuthenticated) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		return next({
			ctx: {
				...ctx,
				// infers the `session` as non-nullable
				session: ctx.session,
				user: ctx.user,
			},
		});
	});

/**
 * Verified (authenticated + email verified) procedure
 *
 * If you want a query or mutation to ONLY be accessible to users with verified emails, use this.
 * It verifies the session is valid AND the email is verified.
 *
 * @see https://trpc.io/docs/procedures
 */
export const verifiedProcedure = t.procedure
	.use(timingMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.session || !ctx.user || !ctx.isAuthenticated) {
			throw new TRPCError({ 
				code: "UNAUTHORIZED",
				message: "You must be logged in to access this resource"
			});
		}
		
		if (!ctx.isEmailVerified) {
			throw new TRPCError({ 
				code: "FORBIDDEN",
				message: "You must verify your email address to access this resource"
			});
		}
		
		return next({
			ctx: {
				...ctx,
				// infers the `session` as non-nullable and verified
				session: ctx.session,
				user: ctx.user,
				isEmailVerified: true, // guaranteed to be true
			},
		});
	});
