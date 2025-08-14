#!/bin/bash
set -e

echo "🚀 Starting application initialization..."

# Wait for database to be ready (if using external DB)
echo "📊 Running database migrations..."
bun run db:migrate

echo "✅ Database migrations completed"

# Start the application
echo "🌟 Starting Next.js application..."
exec "$@"
