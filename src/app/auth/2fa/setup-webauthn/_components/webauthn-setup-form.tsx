"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Shield, Smartphone, KeyRound } from "lucide-react";
import { toast } from "sonner";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";

const setupSchema = z.object({
  name: z.string().min(1, "Passkey name is required").max(50, "Name too long"),
});

type SetupFormData = z.infer<typeof setupSchema>;

interface PasskeyData {
  id: string;
  name: string;
  createdAt: Date;
}

export function WebAuthnSetupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [passkeys, setPasskeys] = useState<PasskeyData[]>([]);

  const form = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: "",
    },
  });

  // Check WebAuthn support
  useEffect(() => {
    const checkSupport = () => {
      const supported = typeof window !== "undefined" && 
        window.PublicKeyCredential !== undefined &&
        typeof navigator.credentials !== "undefined" &&
        typeof navigator.credentials.create === "function";
      
      setIsSupported(supported);
      
      if (supported) {
        loadUserPasskeys();
      }
    };

    checkSupport();
  }, []);

  const loadUserPasskeys = async () => {
    try {
      const response = await authClient.passkey.listUserPasskeys();

      // Normalize various possible response shapes
      let passkeyList: any[] = [];
      if (response && Array.isArray((response as any).data)) {
        passkeyList = (response as any).data;
      } else if (Array.isArray(response)) {
        passkeyList = response as any[];
      } else if (response && typeof response === "object") {
        const candidates = ["passkeys", "items", "results"] as const;
        for (const key of candidates) {
          const maybe = (response as any)[key];
          if (Array.isArray(maybe)) {
            passkeyList = maybe;
            break;
          }
        }
      }

      const formattedPasskeys = passkeyList.map((p) => ({
        id: p.id,
        name: p.name || "Unnamed Passkey",
        createdAt: p.createdAt,
      }));
      setPasskeys(formattedPasskeys);
    } catch (error) {
      console.error("Error loading passkeys:", error);
      toast.error("Failed to load passkeys");
    }
  };

  const onSubmit = async (data: SetupFormData) => {
    setIsLoading(true);
    try {
      const result: any = await authClient.passkey.addPasskey({
        name: data.name,
      });

      const hasError = result && typeof result === "object" && "error" in result && (result as any).error;
      if (hasError) {
        const message = (result as any).error?.message || "Failed to add passkey";
        toast.error(message);
      } else {
        toast.success("Passkey added successfully!");
        await loadUserPasskeys();
        form.reset();
        router.refresh();

        // Redirect to dashboard or show success
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Error adding passkey:", error);
      toast.error("Failed to add passkey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    try {
      const result: any = await authClient.passkey.deletePasskey({
        id,
      });

      const hasError = result && typeof result === "object" && "error" in result && (result as any).error;
      if (hasError) {
        const message = (result as any).error?.message || "Failed to delete passkey";
        toast.error(message);
      } else {
        toast.success("Passkey deleted successfully");
        await loadUserPasskeys();
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting passkey:", error);
      toast.error("Failed to delete passkey");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Passkey Not Supported</CardTitle>
          <CardDescription>
            Your browser doesn't support WebAuthn or you're using an insecure context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Requirements</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                <li>HTTPS connection (required for production)</li>
                <li>Modern browser with WebAuthn support</li>
                <li>Secure context (localhost or HTTPS)</li>
              </ul>
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={() => router.push("/dashboard")}
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Set up Passkey</CardTitle>
          <CardDescription>
            Add a passkey to your account for secure, passwordless authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Enhanced Security</AlertTitle>
                <AlertDescription>
                  Passkeys use your device's built-in authenticator (Touch ID, Face ID, or Windows Hello) 
                  for secure authentication without passwords.
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passkey Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., My MacBook Touch ID"
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
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Passkey
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {passkeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Passkeys</CardTitle>
            <CardDescription>
              Manage your registered passkeys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {passkey.name.toLowerCase().includes("iphone") || 
                       passkey.name.toLowerCase().includes("android") ? (
                        <Smartphone className="h-4 w-4" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{passkey.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Added {formatDate(passkey.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePasskey(passkey.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
