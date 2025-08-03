import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GalleryVerticalEnd, User, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const { user } = session;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <span className="font-semibold">Better Auth</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user.name}
            </span>
            <Avatar className="size-8">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback>
                {user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your protected dashboard area
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
              <User className="ml-auto size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{user.name}</div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3" />
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Status</CardTitle>
              <Shield className="ml-auto size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">Secure</div>
                <p className="text-xs text-muted-foreground">
                  Your account is protected with Better Auth
                </p>
                <div className="text-xs text-muted-foreground">
                  Email verified: {user.emailVerified ? "Yes" : "No"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/2fa/setup-totp">Setup 2FA</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/2fa/recovery-codes">Recovery Codes</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Session Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>
              Details about your current authentication session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium">Session ID</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {session.id}
                </p>
              </div>
              <div>
                <h4 className="font-medium">Expires At</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.expiresAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="font-medium">User Agent</h4>
                <p className="text-sm text-muted-foreground">
                  {session.userAgent || "Unknown"}
                </p>
              </div>
              <div>
                <h4 className="font-medium">IP Address</h4>
                <p className="text-sm text-muted-foreground">
                  {session.ipAddress || "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}