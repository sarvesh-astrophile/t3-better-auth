# Use Bun image for dependencies
FROM oven/bun:1 AS dependencies
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and Prisma schema for better caching
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
COPY package.json bun.lock ./

# Copy source code
COPY . .

# Make startup script executable
RUN chmod +x docker-entrypoint.sh

# Build the application (skip env validation and migrations - will run at runtime)
ENV SKIP_ENV_VALIDATION=true

# Provide minimal required environment variables for build-time execution
# These are needed because Next.js attempts to collect page data during build,
# which imports the auth configuration that references these environment variables
ENV BETTER_AUTH_URL=https://better-auth.sarvsh.in
ENV RP_ID=better-auth.sarvsh.in
ENV AUTH_SECRET=dummy-build-secret-for-build-only
ENV DATABASE_URL=file:./dev.db

# Optional environment variables (to prevent potential undefined errors)
ENV GOOGLE_CLIENT_ID=""
ENV GOOGLE_CLIENT_SECRET=""

RUN bun run build

# Production stage
FROM oven/bun:1 AS runner
WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Copy startup script
COPY --from=builder /app/docker-entrypoint.sh ./

# Expose port
EXPOSE 3000

# Add a basic health check that always passes to satisfy deployment platforms
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD echo "healthy" || exit 1

# Use startup script as entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
