# WebAuthn Passkey Debugging Guide

## Issues Fixed

✅ **Server Configuration**: Updated `src/lib/auth.ts` with proper authenticator selection settings
✅ **Client Error Handling**: Improved error messages and handling in setup forms
✅ **Database Schema**: Verified Passkey table exists and is in sync
✅ **Type Safety**: Fixed TypeScript issues in authenticator list component
✅ **Conditional UI**: Added proper autocomplete attributes and conditional mediation setup

## Key Changes Made

### 1. Server-side Configuration (`src/lib/auth.ts`)
```typescript
passkey({
  rpName: "Better Auth T3",
  rpID: "localhost", // Change this to your domain in production
  origin: "http://localhost:3000", // URL where registrations and authentications should occur
  authenticatorSelection: {
    authenticatorAttachment: undefined, // Allow both platform and cross-platform
    userVerification: "preferred",
    residentKey: "preferred",
  },
}),
```

### 2. Enhanced Error Handling
- Added specific error messages for different WebAuthn error types
- Improved user feedback for registration failures
- Better logging for debugging

### 3. Fixed Authenticator List Data Handling
- Proper type handling for Better Auth passkey responses
- Support for multiple response formats

## Testing Steps

### 1. Prerequisites
- Ensure you're running on `https://` or `localhost` (required for WebAuthn)
- Use a modern browser (Chrome 67+, Firefox 60+, Safari 14+)
- Have a compatible authenticator (built-in biometrics, security key, etc.)

### 2. Test WebAuthn Registration
1. Navigate to `/auth/2fa/setup-webauthn`
2. Check browser console for support messages
3. Try registering with both platform and cross-platform authenticators
4. Verify passkey appears in `/auth/2fa/manage-authenticators`

### 3. Test WebAuthn Sign-in
1. Navigate to `/auth/login`
2. Check for conditional UI autofill (if supported)
3. Try explicit passkey sign-in button
4. Verify 2FA verification with passkey

### 4. Browser Console Debugging
Check for these logs:
- "WebAuthn is supported on this device"
- "Platform authenticator available: true/false"
- "Conditional mediation available: true/false"
- Passkey registration/authentication results

### 5. Common Issues & Solutions

#### Issue: "Registration was cancelled"
- **Cause**: User cancelled the prompt or authenticator timed out
- **Solution**: Try again, ensure authenticator is ready

#### Issue: "This authenticator type is not supported"
- **Cause**: Device doesn't support the requested authenticator type
- **Solution**: Try different authenticator type (platform vs cross-platform)

#### Issue: "Security error occurred"
- **Cause**: Not running on secure context (HTTPS/localhost)
- **Solution**: Ensure proper SSL setup or use localhost

#### Issue: "No valid passkey found"
- **Cause**: No passkeys registered for the account
- **Solution**: Register a passkey first via setup flow

## Environment Variables
Ensure these are set correctly:
```env
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

## Production Considerations
- Update `rpID` to your actual domain (e.g., "example.com")
- Update `origin` to your production URL (e.g., "https://example.com")
- Ensure HTTPS is properly configured
- Test with different browsers and devices

## Database Schema
The Passkey table should include these fields:
- `id` (String, Primary Key)
- `name` (String, Optional)
- `publicKey` (String)
- `userId` (String, Foreign Key)
- `credentialID` (String)
- `counter` (Int)
- `deviceType` (String)
- `backedUp` (Boolean)
- `transports` (String, Optional)
- `createdAt` (DateTime)
- `aaguid` (String, Optional)

## Next Steps
If issues persist:
1. Check browser compatibility
2. Verify HTTPS/localhost setup
3. Test with different authenticators
4. Check Better Auth documentation for updates
5. Enable debug mode in Better Auth configuration
