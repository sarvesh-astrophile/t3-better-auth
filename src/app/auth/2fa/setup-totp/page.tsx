import { GalleryVerticalEnd } from "lucide-react"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { TOTPSetupForm } from "./_components/totp-setup-form"
import { getSessionWithVerification } from "@/lib/session-utils"

export default async function SetupTOTPPage() {
  // Server-side verification to ensure user is authenticated and email verified
  const headersList = await headers();
  const sessionData = await getSessionWithVerification(headersList);
  
  // Redirect unauthenticated users to login
  if (!sessionData.isAuthenticated) {
    redirect("/auth/login");
  }
  
  // Redirect unverified users to email verification first
  if (!sessionData.isEmailVerified) {
    const verificationUrl = sessionData.user?.email 
      ? `/auth/verify-otp?email=${encodeURIComponent(sessionData.user.email)}`
      : '/auth/verify-otp';
    redirect(verificationUrl);
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Better Auth T3
        </a>
        <TOTPSetupForm />
      </div>
    </div>
  )
}