"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function DevEmailLink() {
  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open("/api/dev-emails", "_blank")}
        className="shadow-lg bg-white/95 backdrop-blur-sm hover:bg-white"
      >
        <Mail className="mr-2 size-4" />
        Dev Emails
      </Button>
    </div>
  );
}