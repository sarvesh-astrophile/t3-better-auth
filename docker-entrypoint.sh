#!/bin/bash
set -e

echo "🚀 Starting application initialization..."

# Wait for database to be ready (if using external DB)
echo "📊 Running database migrations..."
bun run db:migrate

echo "✅ Database migrations completed"

# Start the application
echo "🌟 Starting Next.js application..."

# If no arguments provided or invalid arguments, default to starting the app
if [ $# -eq 0 ] || [[ "$1" == "--"* ]]; then
    exec bun run start
else
    exec "$@"
fi
