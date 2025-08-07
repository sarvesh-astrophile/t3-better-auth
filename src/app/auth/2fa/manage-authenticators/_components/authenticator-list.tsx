"use client";

import { api } from "@/trpc/react";
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

export function AuthenticatorList() {
  const { toast } = useToast();
  const listAuthenticators = api.webauthn.listAuthenticators.useQuery();
  const removeAuthenticator = api.webauthn.removeAuthenticator.useMutation({
    onSuccess: () => {
      listAuthenticators.refetch();
      toast({
        title: "Success",
        description: "Authenticator removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to remove authenticator.",
        variant: "destructive",
      });
    },
  });

  if (listAuthenticators.isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="mr-2 size-8 animate-spin" />
        <span>Loading Authenticators...</span>
      </div>
    );
  }

  if (listAuthenticators.error) {
    return (
      <div className="text-red-500">
        Error: {listAuthenticators.error.message}
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
        {listAuthenticators.data?.length === 0 ? (
          <p>No authenticators registered.</p>
        ) : (
          <ul className="space-y-4">
            {listAuthenticators.data?.map((authenticator) => (
              <li
                key={authenticator.id}
                className="border-border flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <Key className="size-6" />
                  <div>
                    <p className="font-medium">
                      Authenticator #{authenticator.id.substring(0, 6)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Device Type: {authenticator.credentialDeviceType}
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() =>
                    removeAuthenticator.mutate({ id: authenticator.id })
                  }
                  disabled={removeAuthenticator.isPending}
                >
                  {removeAuthenticator.isPending ? (
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

