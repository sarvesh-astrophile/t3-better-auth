import { GalleryVerticalEnd } from "lucide-react";
import { AuthShowcase } from "@/components/auth-showcase";

export default function Home() {
	return (
		<div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				{/* Logo and Brand */}
				<a href="#" className="flex items-center gap-2 self-center font-medium">
					<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
						<GalleryVerticalEnd className="size-4" />
					</div>
					Better Auth
				</a>

				{/* Auth Showcase Component */}
				<AuthShowcase />

				{/* Terms and Privacy */}
				<div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
					By continuing, you agree to our <a href="#">Terms of Service</a>{" "}
					and <a href="#">Privacy Policy</a>.
				</div>
			</div>
		</div>
	);
}
