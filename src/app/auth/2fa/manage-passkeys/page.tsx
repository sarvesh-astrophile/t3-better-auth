import { Suspense } from "react";
import { ManagePasskeysContent } from "./_components/manage-passkeys-content";
import { LoadingSkeleton } from "./_components/loading-skeleton";

export default function ManagePasskeysPage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Manage Passkeys</h1>
        <p className="text-muted-foreground">
          Securely manage your passkeys for passwordless authentication
        </p>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <ManagePasskeysContent />
      </Suspense>
    </div>
  );
}