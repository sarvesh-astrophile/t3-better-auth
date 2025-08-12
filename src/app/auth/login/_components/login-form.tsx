"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [supportsWebAuthn, setSupportsWebAuthn] = useState(false);
  const [supportsConditionalUI, setSupportsConditionalUI] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check for WebAuthn support and enable conditional UI if available
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (typeof window === "undefined") return;

      const hasWebAuthn = typeof window.PublicKeyCredential !== "undefined";
      if (isMounted) setSupportsWebAuthn(hasWebAuthn);

      const canCheckConditional =
        hasWebAuthn && typeof window.PublicKeyCredential.isConditionalMediationAvailable === "function";

      if (canCheckConditional) {
        try {
          const available = await window.PublicKeyCredential.isConditionalMediationAvailable();
          if (isMounted) setSupportsConditionalUI(!!available);

          if (available) {
            // Initialize conditional UI; ensure promise is handled
            void authClient.signIn
              .passkey({ autoFill: true })
              .catch((error: unknown) => {
                console.warn("Conditional UI init failed:", error);
              });
          }
        } catch (error) {
          console.warn("Error checking conditional mediation support:", error);
        }
      }
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email(data, {
        onSuccess: () => {
          toast.success("Successfully logged in!");
          router.push("/dashboard");
          router.refresh();
        },
      });

      if (result?.error) {
        toast.error(result.error.message || "Invalid credentials");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    setIsPasskeyLoading(true);
    try {
      const result = await authClient.signIn.passkey(
        {
          email: form.getValues("email") || undefined,
          autoFill: false,
        },
        {
          onSuccess: () => {
            toast.success("Successfully logged in with passkey!");
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx) => {
            const message = ctx?.error?.message || "Passkey authentication failed";
            if (message.includes("User not found")) {
              toast.error("No account found. Please sign up first.");
              router.push("/auth/signup");
            } else if (
              message.includes("NotAllowedError") ||
              message.includes("AbortError")
            ) {
              toast.error("Request was cancelled or timed out. Please try again.");
            } else if (message.includes("SecurityError")) {
              toast.error("Security error. Ensure you're on a secure origin that matches RP ID.");
            } else if (
              message.includes("InvalidStateError") ||
              message.toLowerCase().includes("no passkey")
            ) {
              toast.error("No valid passkey found for this account.");
            } else {
              toast.error(message);
            }
          },
        }
      );

      // Fallback handling if callbacks didn't run
      if (result?.error) {
        const message = result.error.message || "Passkey authentication failed";
        toast.error(message);
      }
    } catch (error: any) {
      const message: string = error?.message || "Passkey authentication failed";
      toast.error(message);
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (error) {
      toast.error("Google sign-in failed");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account with email, passkey, or Google
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="username webauthn"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password webauthn"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isPasskeyLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>

        {supportsWebAuthn && (
          <>
            <Separator />
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handlePasskeySignIn}
                disabled={isLoading || isPasskeyLoading}
              >
                {isPasskeyLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <span className="mr-2">🔐</span>
                )}
                Sign in with Passkey
              </Button>
              {!supportsConditionalUI && (
                <p className="text-xs text-muted-foreground">
                  Your browser does not support passkey autofill. Click the button above to use your passkey.
                </p>
              )}
            </div>
          </>
        )}

        <Separator />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isPasskeyLoading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="text-center text-sm">
          <Link href="/auth/signup" className="text-primary hover:underline">
            Don't have an account? Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
