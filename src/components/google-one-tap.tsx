"use client";

import { useEffect, useState } from "react";
import { useSession, oneTap } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface GoogleOneTapProps {
  /**
   * Whether to show One Tap only on the homepage/auth pages
   * @default true
   */
  restrictToAuthPages?: boolean;
  /**
   * Callback URL after successful login
   * @default "/dashboard"
   */
  callbackURL?: string;
  /**
   * Whether to auto-select the account if only one is available
   * @default false
   */
  autoSelect?: boolean;
}

/**
 * Google One Tap component that provides seamless authentication
 * 
 * This component automatically shows Google One Tap when:
 * - User is not authenticated
 * - User is on an appropriate page (if restrictToAuthPages is true)
 * - One Tap hasn't been dismissed recently
 * 
 * Usage:
 * ```tsx
 * <GoogleOneTap />
 * ```
 */
export function GoogleOneTap({ 
  restrictToAuthPages = true,
  callbackURL = "/dashboard",
  autoSelect = false
}: GoogleOneTapProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [hasShownOneTap, setHasShownOneTap] = useState(false);

  useEffect(() => {
    // Don't show if still loading session or user is already authenticated
    if (isPending || session?.user || hasShownOneTap) {
      return;
    }

    // Check if we should restrict to auth pages
    if (restrictToAuthPages) {
      const pathname = window.location.pathname;
      const authPages = ['/', '/auth/login', '/auth/signup'];
      const isAuthPage = authPages.some(page => pathname === page || pathname.startsWith('/auth'));
      
      if (!isAuthPage) {
        return;
      }
    }

    // Check if One Tap was recently dismissed (within last hour)
    const dismissedAt = localStorage.getItem('google-one-tap-dismissed');
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (dismissedTime > oneHourAgo) {
        return; // Don't show if dismissed within the last hour
      }
    }

    // Show One Tap with Better Auth
    const showOneTap = async () => {
      try {
        setHasShownOneTap(true);
        
        await oneTap({
          fetchOptions: {
            onSuccess: () => {
              // Clear any dismissal timestamp on success
              localStorage.removeItem('google-one-tap-dismissed');
              
              toast({
                title: "Welcome!",
                description: "You've been signed in successfully.",
              });
              
              // Navigate without full page reload
              router.push(callbackURL);
            },
            onError: (error) => {
              console.error("One Tap sign-in error:", error);
              toast({
                title: "Sign-in Error",
                description: "Failed to sign in with Google. Please try again.",
                variant: "destructive",
              });
            }
          },
          onPromptNotification: (notification) => {
            console.log("One Tap prompt notification:", notification);
            
            // If user dismissed the prompt, store the timestamp
            if (notification.isNotDisplayed() || notification.isDismissedMoment()) {
              localStorage.setItem('google-one-tap-dismissed', new Date().toISOString());
            }
            
            // If maximum attempts reached, show alternative sign-in options
            if (notification.isNotDisplayed() && 
                notification.getNotDisplayedReason() === 'suppressed_by_user') {
              toast({
                title: "Alternative Sign-in",
                description: "Use the sign-in button to continue with Google.",
              });
            }
          }
        });
      } catch (error) {
        console.error("Failed to initialize One Tap:", error);
        setHasShownOneTap(false); // Allow retry
      }
    };

    // Small delay to ensure page is fully loaded
    const timeoutId = setTimeout(showOneTap, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [session, isPending, hasShownOneTap, router, toast, callbackURL, restrictToAuthPages, autoSelect]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Manual trigger for Google One Tap
 * Useful for buttons or custom UI elements
 */
export function useGoogleOneTap() {
  const router = useRouter();
  const { toast } = useToast();

  const triggerOneTap = async (options?: {
    callbackURL?: string;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }) => {
    try {
      await oneTap({
        callbackURL: options?.callbackURL || "/dashboard",
        fetchOptions: {
          onSuccess: () => {
            toast({
              title: "Welcome!",
              description: "You've been signed in successfully.",
            });
            
            if (options?.onSuccess) {
              options.onSuccess();
            } else {
              router.push(options?.callbackURL || "/dashboard");
            }
          },
          onError: (error) => {
            console.error("One Tap sign-in error:", error);
            toast({
              title: "Sign-in Error",
              description: "Failed to sign in with Google. Please try again.",
              variant: "destructive",
            });
            
            if (options?.onError) {
              options.onError(error);
            }
          }
        }
      });
    } catch (error) {
      console.error("Failed to trigger One Tap:", error);
      toast({
        title: "Error",
        description: "Unable to initialize Google One Tap.",
        variant: "destructive",
      });
    }
  };

  return { triggerOneTap };
}