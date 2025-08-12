# Google One Tap Setup for Better Auth

This project now includes Google One Tap authentication using Better Auth. Follow these steps to set it up:

## 🚀 Quick Start

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Google OAuth (required for One Tap)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `http://localhost:3000` (add your production domain later)
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### 3. How It Works

The Google One Tap integration includes:

#### Automatic One Tap
- Shows automatically when users visit the homepage or auth pages
- Only appears for unauthenticated users
- Respects user dismissal (won't show again for 1 hour if dismissed)
- Handles exponential backoff for repeated dismissals

#### Manual One Tap Trigger
- Google button in the auth showcase component
- Can be triggered programmatically using `useGoogleOneTap()` hook

## 🛠️ Implementation Details

### Server Configuration
The `oneTap` plugin is added to Better Auth configuration in `src/lib/auth.ts`:

```typescript
plugins: [
  oneTap({
    disableSignup: false, // Allow new users to sign up via One Tap
  }),
],
```

### Client Configuration
The `oneTapClient` plugin is configured in `src/lib/auth-client.ts`:

```typescript
plugins: [
  oneTapClient({
    clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
    autoSelect: false,
    cancelOnTapOutside: true,
    context: "signin",
    promptOptions: {
      baseDelay: 1000,
      maxAttempts: 5
    }
  }),
],
```

### Components

#### GoogleOneTap Component
- `src/components/google-one-tap.tsx`
- Handles automatic One Tap display
- Manages dismissal state and retry logic
- Provides success/error feedback

#### AuthProvider Component
- `src/components/auth-provider.tsx`
- Wraps the app to provide global One Tap functionality
- Excludes One Tap from sensitive pages (OTP verification, 2FA, etc.)

### Usage Examples

#### Automatic (default behavior)
```tsx
// Already included in layout - no additional code needed
```

#### Manual trigger with hook
```tsx
import { useGoogleOneTap } from "@/components/google-one-tap";

function MyComponent() {
  const { triggerOneTap } = useGoogleOneTap();
  
  return (
    <button onClick={() => triggerOneTap({ callbackURL: "/dashboard" })}>
      Sign in with Google One Tap
    </button>
  );
}
```

## 🎯 Features

- ✅ **Seamless Authentication**: One-click sign-in experience
- ✅ **Smart Display Logic**: Only shows when appropriate
- ✅ **Dismissal Handling**: Respects user preferences
- ✅ **Error Handling**: Graceful fallbacks and user feedback
- ✅ **Mobile Friendly**: Works across all devices
- ✅ **Privacy Compliant**: Follows Google's One Tap guidelines

## 🔧 Customization

### Restrict to specific pages
```tsx
<GoogleOneTap 
  restrictToAuthPages={false} // Show on all pages
  callbackURL="/custom-redirect"
  autoSelect={true}
/>
```

### Custom prompt options
```typescript
oneTapClient({
  clientId: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  promptOptions: {
    baseDelay: 2000,    // Wait 2 seconds between retries
    maxAttempts: 3      // Try max 3 times before giving up
  }
})
```

## 🐛 Troubleshooting

### One Tap not showing?
1. Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly
2. Verify Google Cloud Console configuration
3. Check browser console for errors
4. Ensure user is not authenticated
5. Clear localStorage if recently dismissed

### Domain issues in production?
1. Add your production domain to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`
2. Update environment variables for production

### CORS errors?
Ensure your domain is properly configured in Google Cloud Console and matches your environment variables.

## 📱 Browser Support

Google One Tap works in:
- ✅ Chrome (desktop & mobile)
- ✅ Firefox (desktop & mobile)  
- ✅ Safari (desktop & mobile)
- ✅ Edge (desktop & mobile)

## 🔒 Security Notes

- One Tap tokens are validated server-side by Better Auth
- No sensitive data is stored in localStorage (only dismissal timestamps)
- Follows Google's security best practices
- Integrates with existing email verification flow

---

For more details, see the [Better Auth One Tap documentation](https://www.better-auth.com/docs/plugins/one-tap).