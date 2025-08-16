# syntax=docker/dockerfile:1.7

# Multi-stage Dockerfile for Next.js 15 + Bun + Prisma

FROM oven/bun:1 AS deps
WORKDIR /app

# Skip env validation during install/build inside Docker
ENV SKIP_ENV_VALIDATION=1

COPY bun.lock package.json ./
COPY prisma ./prisma

# Install all dependencies (including dev for building)
RUN bun install --ci --frozen-lockfile && bunx prisma generate


FROM oven/bun:1 AS builder
WORKDIR /app

ARG BETTER_AUTH_URL=http://localhost:3000
ARG NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
ARG RP_ID=localhost
ARG AUTH_SECRET=dev-secret
ENV SKIP_ENV_VALIDATION=1 \
    NEXT_TELEMETRY_DISABLED=1 \
    BETTER_AUTH_URL=$BETTER_AUTH_URL \
    NEXT_PUBLIC_BETTER_AUTH_URL=$NEXT_PUBLIC_BETTER_AUTH_URL \
    RP_ID=$RP_ID \
    AUTH_SECRET=$AUTH_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure Prisma Client is generated for builder environment too (uses schema binaryTargets)
RUN bunx prisma generate && bun run build


FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Copy only what is needed to run the built app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY next.config.js ./
COPY public ./public
COPY src/env.js ./src/env.js
COPY --from=builder /app/.next ./.next
COPY prisma ./prisma

EXPOSE 3000

# Apply migrations if present; fall back to db push for first deploys, then start server
# Install openssl for Prisma engines; run migrations then start
USER root
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
USER bun
CMD ["sh","-c","bunx prisma migrate deploy || bunx prisma db push; bun run start -p ${PORT} -H 0.0.0.0"]


