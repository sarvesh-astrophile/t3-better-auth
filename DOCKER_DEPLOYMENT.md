# 🐳 Docker Deployment Guide

## Quick Fix for Coolify Restart Issues

Your container is restarting because **required environment variables are missing**. Here's how to fix it:

### 1. Required Environment Variables

Set these in your Coolify environment variables:

```bash
# Required - Authentication secret
AUTH_SECRET=your-super-secret-auth-key-change-this-in-production

# Required - WebAuthn Relying Party ID (your domain)
RP_ID=yourdomain.com

# Optional - Database URL (defaults to SQLite if not set)
DATABASE_URL=file:./dev.db
```

### 2. Generate AUTH_SECRET

Run one of these commands to generate a secure auth secret:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

### 3. Set RP_ID Correctly

- **For localhost/development**: `RP_ID=localhost`
- **For production domain**: `RP_ID=yourdomain.com` (without https://)

### 4. Full Environment Variables List

#### Required:
```bash
AUTH_SECRET=your-generated-secret-here
RP_ID=yourdomain.com
```

#### Optional (for additional features):
```bash
# Better Auth URL
BETTER_AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 5. Coolify Setup Steps

1. **Go to your Coolify project**
2. **Navigate to Environment Variables section**
3. **Add the required variables:**
   - `AUTH_SECRET` = (your generated secret)
   - `RP_ID` = (your domain, e.g., "myapp.com")
4. **Save and redeploy**

### 6. Verify Deployment

After setting the environment variables, your logs should show:

```
🚀 Starting application initialization...
🔍 Checking required environment variables...
✅ All required environment variables are set
📊 Running database migrations...
✅ Database migrations completed
🌟 Starting Next.js application...
🌐 Application will be available on port 3000
   ▲ Next.js 15.4.5
   - Local:        http://localhost:3000
 ✓ Ready in 1497ms
```

### 7. Health Check

The container now includes a health check endpoint at `/api/health` that Coolify can use to monitor your application.

### 8. Troubleshooting

If the container still restarts:

1. **Check logs** - Missing environment variables will be clearly listed
2. **Verify RP_ID** - Should match your domain exactly
3. **Check AUTH_SECRET** - Should be a long, secure string
4. **Database issues** - Ensure DATABASE_URL is correct if using external DB

### 9. Production Security Notes

- **Never commit** your actual `AUTH_SECRET` to version control
- **Use strong secrets** - minimum 32 characters
- **Use HTTPS** in production for WebAuthn to work properly
- **Set RP_ID** to your actual domain in production

---

## Example Coolify Environment Variables

For a production deployment on `myapp.com`:

```bash
AUTH_SECRET=AbCdEf123456789aBcDeF123456789aBcDeF12345678
RP_ID=myapp.com
BETTER_AUTH_URL=https://myapp.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://myapp.com
DATABASE_URL=file:./dev.db
```

That's it! Your container should now start successfully. 🎉
