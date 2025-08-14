#!/bin/bash
set -e

echo "🚀 Starting application initialization..."

# Check for required environment variables
echo "🔍 Checking required environment variables..."

required_vars=("AUTH_SECRET" "RP_ID")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "💡 Set these in your Coolify environment variables:"
    echo "   AUTH_SECRET=your-secret-key-here"
    echo "   RP_ID=your-domain.com"
    echo ""
    echo "🔄 Container will restart until these are set..."
    exit 1
fi

# Set default DATABASE_URL if not provided
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:./dev.db"
    echo "📄 Using default SQLite database: $DATABASE_URL"
fi

echo "✅ All required environment variables are set"

# Wait for database to be ready (if using external DB)
echo "📊 Running database migrations..."
bun run db:migrate

echo "✅ Database migrations completed"

# Start the application with better error handling
echo "🌟 Starting Next.js application..."
echo "🌐 Application will be available on port 3000"

# If no arguments provided or invalid arguments, default to starting the app
if [ $# -eq 0 ] || [[ "$1" == "--"* ]]; then
    exec bun run start
else
    exec "$@"
fi
