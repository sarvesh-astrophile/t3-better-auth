import { GalleryVerticalEnd } from "lucide-react"
import Link from "next/link"

import { WebAuthnSetupForm } from "./_components/webauthn-setup-form"

export default function SetupWebAuthnPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-lg flex-col gap-6">
        <Link
          href="/dashboard"
          className="w-fit text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </Link>
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Better Auth T3
        </a>
        <WebAuthnSetupForm />
      </div>
    </div>
  )
}