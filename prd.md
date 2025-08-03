<context>
# Overview
This document outlines the requirements for a modern web application featuring a robust and user-friendly authentication system. The project aims to provide a seamless login experience for users, leveraging both traditional email/password and Google's OAuth service, with a focus on frictionless sign-in using Google One-Tap. It will be built using the T3 stack, with UI components from shadcn/ui, authentication handled by the `better-auth` library, and email services provided by Plunk.

# Core Features
1.  **User Authentication**
    - **What it does:** Allows users to sign up and log in to the application via dedicated authentication pages or Google's One-Tap feature.
    - **Why it's important:** Provides secure access to user-specific data and application features with a clear and organized routing structure.
    - **How it works:**
        - **Authentication Routes:** The application will use a clear routing structure under `/auth`, including `/auth/login`, `/auth/signup`, and `/auth/verify-2fa`.
        - **Google OAuth (Button):** The `/auth/login` page will feature a "Sign in with Google" button.
        - **Google One-Tap:** On the home screen, returning users with active Google sessions will see a non-intrusive prompt to sign in.
        - **Email Services:** All transactional emails (e.g., email verification, password reset) will be sent via the Plunk API.
        - **Implementation:** The `better-auth` library will be integrated to handle all authentication logic.

2.  **2FA Verification Step**
    - **What it does:** Intercepts the login flow for users who have 2FA enabled, requiring them to complete a second-factor challenge before granting access.
    - **Why it's important:** Enforces the second layer of security at the point of entry, ensuring that credentials alone are not enough to access a 2FA-protected account.
    - **How it works:**
        - After a successful primary login (e.g., password or Google OAuth), the system checks if 2FA is enabled for the user.
        - If 2FA is active, the user is redirected to `/auth/verify-2fa`. A temporary cookie or server-side state will indicate that the primary authentication was successful but is pending 2FA verification.
        - On the verification page, the user can choose from their enabled 2FA methods (e.g., TOTP code, WebAuthn prompt, Recovery Code).
        - Upon successful 2FA validation, the temporary state is cleared, a full session is established, and the user is redirected to the application dashboard.

3.  **Homepage**
    - **What it does:** Serves as the main, unauthenticated landing page.
    - **Why it's important:** Provides a simple, clear entry point for all users.
    - **How it works:** A minimal, static homepage containing "Login" and "Sign Up" buttons that navigate to `/auth/login` and `/auth/signup` respectively. It will also trigger the Google One-Tap UI for eligible returning users.

4.  **Dedicated Authentication Pages**
    - **What it does:** A set of pages under the `/auth/` route group for all manual sign-in and sign-up actions.
    - **Why it's important:** Centralizes the authentication process for users who are not eligible for One-Tap or prefer manual login.
    - **How it works:** Pages like `/auth/login` and `/auth/signup` will host `shadcn/ui` components for forms and the "Sign in with Google" button.

5.  **2FA Management Dashboard**
    - **What it does:** Provides a secure, dedicated dashboard for logged-in users to optionally enable and manage multiple two-factor authentication methods.
    - **Why it's important:** Significantly enhances account security by adding a second layer of verification, giving users control over their security preferences.
    - **How it works:**
        - After logging in, users can navigate to `/dashboard/security`.
        - **TOTP (Time-based One-Time Password):** Users can enable 2FA with an authenticator app.
        - **WebAuthn Registration:** Allows users to register passkeys and hardware security keys.
        - **Recovery Codes:** Users are provided with recovery codes upon enabling 2FA.

# User Experience
- **User Personas:**
    - **New User:** Someone visiting the application for the first time who needs to create an account.
    - **Returning User:** An existing user who can benefit from One-Tap login.
- **Key User Flows:**
    1.  A returning user with 2FA enabled signs in at `/auth/login`. They are then redirected to `/auth/verify-2fa` to complete the login.
    2.  A new user lands on the homepage, clicks "Sign Up," and registers using their email. They then receive a verification email from Plunk.
    3.  A logged-in user navigates to `/dashboard/security` to enable WebAuthn.
- **UI/UX Considerations:**
    - The UI will be clean, modern, and fully responsive, built with `shadcn/ui`.
    - The authentication flow will be intuitive and secure.
</context>
<PRD>
# Technical Architecture
- **System Components:**
    - **Framework:** Next.js (from the T3 Stack)
    - **API Layer:** tRPC.
    - **Database ORM:** Prisma.
    - **Database:** PostgreSQL.
    - **Authentication Library:** `better-auth`.
    - **UI Library:** `shadcn/ui`.
    - **Email Service:** Plunk.
- **Project Structure and Conventions:**
    - **tRPC Procedures:** Use `protectedProcedure` for authenticated endpoints.
    - **API Route Location:** Routers defined in `src/server/api/routers/`.
    - **Utility File Location:** Shared utilities in `src/app/utils/`.
    - **Page Route Structure:** Auth pages under `/auth`, dashboard under `/dashboard`.
- **Data Models (managed by Prisma & better-auth):**
    - `User`, `Session`, `Account`, and models for 2FA/WebAuthn.
- **APIs and Integrations:**
    - **Google OAuth 2.0 API.**
    - **Plunk API:** For sending all transactional emails.
    - **tRPC Endpoints:** For auth, 2FA management, and verification.

# Development Roadmap (MVP)
1.  Initialize a new T3 Stack project.
2.  Set up `shadcn/ui`.
3.  Integrate and configure the `better-auth` library.
4.  Integrate the Plunk SDK for email sending.
5.  Set up the database and Prisma schema.
6.  Set up Google OAuth and Plunk API credentials.
7.  Implement backend logic for primary authentication and email verification.
8.  Build the blank homepage and the auth pages: `/auth/login`, `/auth/signup`.
9.  Implement the post-login 2FA verification flow, including the `/auth/verify-2fa` page.
10. Implement Google One-Tap login on the home screen.
11. Build the 2FA Management Dashboard UI at `/dashboard/security`.
12. Implement backend tRPC procedures for TOTP, WebAuthn, and recovery codes.
13. Integrate the frontend dashboard and 2FA verification page with the backend endpoints.

# Logical Dependency Chain
1.  **Foundation:** Project setup with T3 stack, DB, `shadcn/ui`, Plunk.
2.  **Backend Authentication:** Configure `better-auth`, Prisma, Google OAuth, and Plunk.
3.  **Frontend Authentication UI:** Build the homepage, `/auth/login`, and `/auth/signup` pages.
4.  **2FA Verification Flow:** Implement the `/auth/verify-2fa` page and logic.
5.  **Homepage & One-Tap:** Implement Google One-Tap functionality.
6.  **Integration:** Connect frontend components to backend tRPC procedures.
7.  **Account Security Dashboard:** Build the 2FA management dashboard.

# Risks and Mitigations
- **Risk:** Insecure handling of the intermediate authentication state before 2FA verification.
- **Mitigation:** Use secure, short-lived, server-side state or httpOnly, signed cookies.
- **Risk:** Email deliverability issues with Plunk.
- **Mitigation:** Configure DNS records (SPF, DKIM) correctly. Monitor email sending reputation.

# Appendix
- **Research findings:** N/A
- **Technical specifications:**
    - T3 Stack (Next.js, TypeScript, tRPC, Prisma, Tailwind CSS)
    - `better-auth` library
    - `shadcn/ui` for UI components.
    - Plunk for emails.
    - **Code Conventions:**
        - Use `protectedProcedure` for authenticated tRPC endpoints.
        - Routers in `src/server/api/routers/`.
        - Authentication pages under `/auth/`.
        - Dashboard pages under `/dashboard/`.
</PRD>
