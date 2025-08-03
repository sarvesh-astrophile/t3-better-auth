# Setting up Email for Localhost Development

The error you're seeing indicates that your EMAIL_FROM domain is not verified with your Plunk account. Here's how to fix it:

## Option 1: Use Plunk's Default Verified Domain (Recommended for Development)

1. **Login to your Plunk dashboard**: https://app.useplunk.com
2. **Get your default sending email**: Plunk usually provides a default email like `noreply@mail.useplunk.com`
3. **Update your .env file**:
   ```bash
   EMAIL_FROM="noreply@mail.useplunk.com"  # Use Plunk's default domain
   ```

## Option 2: Verify Your Own Domain

1. **Add your domain** in the Plunk dashboard under "Domains"
2. **Add the required DNS records** (DKIM, SPF, DMARC)
3. **Wait for verification** (can take up to 24 hours)
4. **Use your verified domain** in EMAIL_FROM

## Option 3: Use a Development Email Service for Localhost

For localhost development, you can also use these alternatives:

### Ethereal Email (Test emails that don't actually send)
```bash
# In your .env file for development
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USERNAME="your-ethereal-username"
SMTP_PASSWORD="your-ethereal-password"
EMAIL_FROM="test@ethereal.email"
```

### Mailtrap (Testing service)
```bash
# In your .env file for development
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USERNAME="your-mailtrap-username"
SMTP_PASSWORD="your-mailtrap-password"
EMAIL_FROM="test@example.com"
```

## Quick Fix for Right Now

Update your .env file with Plunk's default domain:

```bash
# Your current .env should look like this:
SMTP_HOST="smtp.useplunk.com"
SMTP_PORT="465"
SMTP_USERNAME="plunk"
SMTP_PASSWORD="your-plunk-api-key"
EMAIL_FROM="noreply@mail.useplunk.com"  # <- Change this to Plunk's default
```

## Testing the Setup

1. **Restart your development server**: `bun dev`
2. **Try signing up** with a real email address you can access
3. **Check your email** for the verification link
4. **Test the password reset flow**

The updated error handling will now provide clearer messages if there are still configuration issues.
