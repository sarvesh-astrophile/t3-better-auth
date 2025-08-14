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

# Build the application (skip migrations - will run at runtime)
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

# Use startup script as entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
