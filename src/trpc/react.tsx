"use client";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	httpBatchStreamLink,
	loggerLink,
	splitLink,
	httpBatchLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";

import type { AppRouter } from "@/server/api/root";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		return createQueryClient();
	}
	// Browser: use singleton pattern to keep the same query client
	clientQueryClientSingleton ??= createQueryClient();

	return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: {
	children: React.ReactNode;
	headers: Headers;
}) {
	const [queryClient] = useState(() => getQueryClient());

	const [trpcClient] = useState(() =>
		api.createClient({
			links: [
				loggerLink({
					enabled: (op) =>
						process.env.NODE_ENV === "development" ||
						(op.direction === "down" && op.result instanceof Error),
				}),
				splitLink({
					condition(op) {
						return (
							op.path.startsWith("auth.") ||
							op.path.startsWith("session.")
						);
					},
					true: httpBatchLink({
						url: `${getBaseUrl()}/api/trpc`,
						transformer: SuperJSON,
						headers() {
							const heads = new Map(props.headers);
							heads.set("x-trpc-source", "react-no-stream");
							return Object.fromEntries(heads);
						},
						fetch: (url, options) => {
							return fetch(url, {
								...options,
								credentials: "include",
							} as RequestInit);
						},
					}),
					false: httpBatchStreamLink({
						url: `${getBaseUrl()}/api/trpc`,
						transformer: SuperJSON,
						headers() {
							const heads = new Map(props.headers);
							heads.set("x-trpc-source", "react-stream");
							return Object.fromEntries(heads);
						},
						fetch: (url, options) => {
							return fetch(url, {
								...options,
								credentials: "include",
							} as RequestInit);
						},
					}),
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<api.Provider client={trpcClient} queryClient={queryClient}>
				{props.children}
			</api.Provider>
		</QueryClientProvider>
	);
}

function getBaseUrl() {
	if (typeof window !== "undefined") return window.location.origin;
	if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
	return `http://localhost:${process.env.PORT ?? 3000}`;
}
