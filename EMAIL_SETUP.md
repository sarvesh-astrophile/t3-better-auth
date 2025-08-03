
# Email Setup with Plunk SMTP for Better Auth

This project now includes email verification and password reset functionality using Plunk SMTP service and Better Auth.

## Setup Instructions

1. **Install Dependencies** ✅
   - nodemailer and @types/nodemailer are already installed

2. **Environment Variables**
   Copy the .env.example file and add your Plunk API credentials:
   ```bash
   cp .env.example .env
   ```
   
   Then update these values in your .env file:
   - SMTP_HOST=smtp.useplunk.com
   - SMTP_PORT=465
   - SMTP_USERNAME=plunk
   - SMTP_PASSWORD=your-plunk-api-key (Get this from your Plunk dashboard)
   - EMAIL_FROM=noreply@yourdomain.com (Use a verified domain in Plunk)

3. **Plunk Account Setup**
   - Sign up at https://useplunk.com
   - Verify your sending domain
   - Get your API key from the dashboard
   - Add the API key to your SMTP_PASSWORD environment variable

## Features Implemented

✅ Email verification on signup
✅ Password reset via email
✅ SMTP configuration using Plunk
✅ Email templates (HTML and text)
✅ tRPC routes for email operations
✅ UI components for verification and reset flows
✅ Auto-signin after email verification

## Available Routes

- /auth/verify-email - Email verification page
- /auth/forgot-password - Request password reset
- /auth/reset-password - Reset password with token

## Email Configuration

The email service is configured in src/lib/email.ts with:
- SSL connection on port 465
- Plunk SMTP server (smtp.useplunk.com)
- HTML and text email templates
- Error handling and validation

## Better Auth Configuration

Email verification is now:
- Required for email/password signups
- Automatically sent on signup
- Auto-signs in users after verification
- Includes password reset functionality

## Testing

1. Set up your environment variables
2. Start the development server: `bun dev`
3. Try signing up with email/password
4. Check your email for verification link
5. Test password reset flow

## Notes

- Email verification is required for production (set in auth.ts)
- Verification links expire after 24 hours
- Password reset tokens also expire after 24 hours
- All email templates are responsive and accessible

