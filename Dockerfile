# Use Bun image for dependencies
FROM oven/bun:1 AS dependencies
WORKDIR /app

# Copy package files for better caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json bun.lock ./

# Copy source code
COPY . .

# Generate Prisma client and build
RUN bun run postinstall && \
    bun run db:migrate && \
    bun run build

# Production stage
FROM oven/bun:1 AS runner
WORKDIR /app

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

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]
