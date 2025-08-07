import { GalleryVerticalEnd } from "lucide-react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { VerificationPendingForm } from "./_components/verification-pending-form";
import { getSessionWithVerification } from "@/lib/session-utils";

export default async function VerificationPendingPage() {
  // Server-side verification to prevent verified users from accessing this page
  const headersList = await headers();
  const sessionData = await getSessionWithVerification(headersList);
  
  // Redirect verified users to dashboard immediately
  if (sessionData.isAuthenticated && sessionData.isEmailVerified) {
    redirect("/dashboard");
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Better Auth
        </a>
        <VerificationPendingForm />
      </div>
    </div>
  );
}