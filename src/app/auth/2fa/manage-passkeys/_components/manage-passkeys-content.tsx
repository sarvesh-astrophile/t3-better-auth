"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Shield, Smartphone, KeyRound, Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";

const addPasskeySchema = z.object({
  name: z.string().min(1, "Passkey name is required").max(50, "Name too long"),
});

type AddPasskeyFormData = z.infer<typeof addPasskeySchema>;

interface PasskeyData {
  id: string;
  name: string;
  createdAt: Date;
  deviceType?: string;
  lastUsedAt?: Date;
}

export function ManagePasskeysContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [passkeys, setPasskeys] = useState<PasskeyData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<AddPasskeyFormData>({
    resolver: zodResolver(addPasskeySchema),
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
      const result = await authClient.passkey.listUserPasskeys();
      if (result?.data) {
        const formattedPasskeys = result.data.map(p => ({
          id: p.id,
          name: p.name || "Unnamed Passkey",
          createdAt: p.createdAt,
          deviceType: p.deviceType,
          lastUsedAt: p.createdAt, // Better Auth doesn't track lastUsedAt yet
        }));
        setPasskeys(formattedPasskeys);
      }
    } catch (error) {
      console.error("Error loading passkeys:", error);
      toast.error("Failed to load passkeys");
    }
  };

  const handleAddPasskey = async (data: AddPasskeyFormData) => {
    setIsLoading(true);
    try {
      const result = await authClient.passkey.addPasskey({
        name: data.name,
      });

      if (result?.error) {
        toast.error(result.error.message || "Failed to add passkey");
      } else if (result?.data) {
        toast.success("Passkey added successfully!");
        await loadUserPasskeys();
        form.reset();
        setShowAddForm(false);
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
      const result = await authClient.passkey.deletePasskey({
        id,
      });

      if (result?.error) {
        toast.error(result.error.message || "Failed to delete passkey");
      } else {
        toast.success("Passkey deleted successfully");
        await loadUserPasskeys();
      }
    } catch (error) {
      console.error("Error deleting passkey:", error);
      toast.error("Failed to delete passkey");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getDeviceIcon = (deviceType?: string, name?: string) => {
    const lowerName = name?.toLowerCase() || "";
    
    if (lowerName.includes("iphone") || lowerName.includes("android") || deviceType === "mobile") {
      return <Smartphone className="h-5 w-5" />;
    }
    
    if (lowerName.includes("macbook") || lowerName.includes("windows") || deviceType === "desktop") {
      return <KeyRound className="h-5 w-5" />;
    }
    
    return <Shield className="h-5 w-5" />;
  };

  if (!isSupported) {
    return (
      <Card>
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
            className="mt-4"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Passkeys</h2>
          <p className="text-muted-foreground">
            Manage your passkeys for secure, passwordless authentication
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Passkey
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Passkey</CardTitle>
            <CardDescription>
              Create a new passkey for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddPasskey)} className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Enhanced Security</AlertTitle>
                  <AlertDescription>
                    Your device will prompt you to use biometric authentication (Touch ID, Face ID, etc.) 
                    to create this secure passkey.
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

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Passkey
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {passkeys.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Passkeys Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first passkey to enable passwordless authentication
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Passkey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registered Passkeys</CardTitle>
            <CardDescription>
              {passkeys.length} passkey{passkeys.length !== 1 ? 's' : ''} registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {passkeys.map((passkey) => (
                <div
                  key={passkey.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      {getDeviceIcon(passkey.deviceType, passkey.name)}
                    </div>
                    <div>
                      <p className="font-medium">{passkey.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Added {formatDate(passkey.createdAt)}
                      </p>
                      {passkey.lastUsedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last used {formatDate(passkey.lastUsedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePasskey(passkey.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
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