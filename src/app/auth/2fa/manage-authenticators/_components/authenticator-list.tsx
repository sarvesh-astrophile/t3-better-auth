"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Trash2, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { passkey } from "@/lib/auth-client";
import { useState, useEffect } from "react";

export function AuthenticatorList() {
  const { toast } = useToast();
  const [authenticators, setAuthenticators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchAuthenticators();
  }, []);

  const fetchAuthenticators = async () => {
    try {
      setIsLoading(true);
      const response = await passkey.listUserPasskeys();
      console.log("Passkeys response:", response);
      
      // Handle the response format from Better Auth - check for different response structures
      let passkeys: any[] = [];
      if (response && Array.isArray(response.data)) {
        passkeys = response.data;
      } else if (response && typeof response === 'object' && 'passkeys' in response && Array.isArray((response as any).passkeys)) {
        passkeys = (response as any).passkeys;
      } else if (Array.isArray(response)) {
        passkeys = response;
      } else if (response && typeof response === 'object') {
        // If it's an object but not an array, check for common array properties
        const possibleArrays = ['data', 'passkeys', 'items', 'results'];
        for (const prop of possibleArrays) {
          if ((response as any)[prop] && Array.isArray((response as any)[prop])) {
            passkeys = (response as any)[prop];
            break;
          }
        }
      }
      
      setAuthenticators(passkeys);
    } catch (error) {
      console.error("Error fetching authenticators:", error);
      toast({
        title: "Error",
        description: "Failed to load authenticators.",
        variant: "destructive",
      });
      setAuthenticators([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeAuthenticator = async (id: string) => {
    try {
      setIsRemoving(id);
      await passkey.deletePasskey({ id });
      await fetchAuthenticators(); // Refresh the list
      toast({
        title: "Success",
        description: "Passkey removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove passkey.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="mr-2 size-8 animate-spin" />
        <span>Loading Passkeys...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Authenticators</CardTitle>
        <CardDescription>
          View and remove your registered security keys and biometrics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authenticators.length === 0 ? (
          <p>No passkeys registered.</p>
        ) : (
          <ul className="space-y-4">
            {authenticators.map((authenticator) => (
              <li
                key={authenticator.id}
                className="border-border flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <Key className="size-6" />
                  <div>
                    <p className="font-medium">
                      {authenticator.name || `Passkey #${authenticator.id.substring(0, 6)}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(authenticator.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeAuthenticator(authenticator.id)}
                  disabled={isRemoving === authenticator.id}
                >
                  {isRemoving === authenticator.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

