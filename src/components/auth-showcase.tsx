"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, User } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function AuthShowcase() {
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { toast } = useToast();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({
        callbackURL: "/",
      });
      toast({
        title: "Success",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isPending) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session?.user) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome to Better Auth</CardTitle>
          <CardDescription>
            Please sign in to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/signup">
                <User className="mr-2 size-4" />
                Create Account
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">
                <LogOut className="mr-2 size-4" />
                Sign In
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back!</CardTitle>
        <CardDescription>
          You are successfully authenticated
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="size-16">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback>
              {session.user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <h3 className="font-medium">{session.user.name}</h3>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>

          <div className="grid w-full gap-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}