# Deployment Guide - T3 Better Auth App

This guide will help you deploy your T3 stack application using nixpacks and Coolify.

## 🚀 Quick Deploy with Coolify

### Prerequisites
- Coolify instance set up and running
- Access to your Git repository

### Step 1: Push Your Code
Ensure your code is pushed to your Git repository with the `nixpacks.toml` file in the root.

### Step 2: Create New Application in Coolify
1. Log into your Coolify dashboard
2. Click "New Application"
3. Select your Git repository
4. Choose the branch you want to deploy

### Step 3: Configure Environment Variables
Set these environment variables in Coolify (copy from `env.deployment.example`):

#### Required Variables:
```bash
# Database
DATABASE_URL="file:./prisma/dev.db"  # Or your PostgreSQL URL for production
NODE_ENV="production"

# Auth Configuration
AUTH_SECRET="your-super-secret-key"  # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_BETTER_AUTH_URL="https://your-domain.com"
RP_ID="your-domain.com"  # Your domain without https://

# Deployment
PORT="3000"
NEXT_TELEMETRY_DISABLED="1"
```

#### Optional Variables (for additional features):
```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"

# Email (Plunk SMTP)
SMTP_HOST="smtp.useplunk.com"
SMTP_PORT="465"
SMTP_USERNAME="plunk"
SMTP_PASSWORD="your-plunk-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

### Step 4: Deploy
1. Click "Deploy" in Coolify
2. Monitor the build process
3. Check the health endpoint at `/api/health` once deployed

## 🔧 Manual nixpacks Build

If you want to build locally or test the configuration:

```bash
# Install nixpacks if not already installed
npm install -g @railway/nixpacks

# Build the image
nixpacks build . --name t3-better-auth

# Run the container
docker run -p 3000:3000 \
  -e AUTH_SECRET="your-secret" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  -e RP_ID="localhost" \
  t3-better-auth
```

## 📁 What the nixpacks.toml Does

1. **Setup Phase**: Installs system dependencies
2. **Install Phase**: Runs `bun install` to install Node.js dependencies
3. **Build Phase**: 
   - Generates Prisma client
   - Runs database migrations
   - Builds the Next.js application
4. **Start Phase**: Starts the production server with `bun run start`

## 🗄️ Database Options

### SQLite (Default)
- Good for development and small production deployments
- Database file is created automatically
- No external database required

### PostgreSQL (Recommended for Production)
1. Set up a PostgreSQL database
2. Update `DATABASE_URL` environment variable:
   ```bash
   DATABASE_URL="postgresql://username:password@host:port/database"
   ```

## 🔍 Health Check

The deployment includes a health check endpoint at `/api/health` that:
- Verifies the application is running
- Tests database connectivity
- Returns status information

## 🔒 Security Checklist

- [ ] Generate a strong `AUTH_SECRET` (use `openssl rand -base64 32`)
- [ ] Set correct `BETTER_AUTH_URL` to your production domain
- [ ] Configure `RP_ID` to your domain (without protocol)
- [ ] Use HTTPS in production
- [ ] Set up proper CORS origins in your auth configuration
- [ ] Use a production database (PostgreSQL recommended)

## 🐛 Troubleshooting

### Build Fails
- Check that all required environment variables are set
- Verify `AUTH_SECRET` is properly generated
- Ensure `DATABASE_URL` is valid

### Health Check Fails
- Check database connectivity
- Verify Prisma migrations ran successfully
- Check application logs in Coolify

### Authentication Issues
- Verify `BETTER_AUTH_URL` matches your domain
- Check `RP_ID` is set to your domain without protocol
- Ensure cookies are working (check secure/sameSite settings)

## 📚 Additional Resources

- [nixpacks Documentation](https://nixpacks.com/docs)
- [Coolify Documentation](https://coolify.io/docs)
- [Better Auth Documentation](https://better-auth.com)
- [T3 Stack Documentation](https://create.t3.gg)

---

🎉 **Your T3 Better Auth application should now be successfully deployed!**

Visit your deployed URL and check `/api/health` to verify everything is working correctly.
