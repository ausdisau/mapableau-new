"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function RevokeConsentButton({ consentId }: { consentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/consents/${consentId}/revoke`, {
      method: "POST",
    });
    if (!res.ok) {
      setError("Revoke failed");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="default"
        variant="outline"
        className="min-h-11"
        disabled={loading}
        onClick={() => void revoke()}
      >
        {loading ? "Revoking…" : "Revoke"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
