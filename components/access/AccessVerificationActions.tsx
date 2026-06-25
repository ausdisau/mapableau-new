"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AccessVerificationActions({
  entityType,
  entityId,
}: {
  entityType: "AccessPlaceReview" | "AccessAlert" | "AccessPlace";
  entityId: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(action: string) {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/access/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityType, entityId, action }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Could not submit");
      return;
    }
    setStatus(action);
  }

  if (status) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Thank you — your response was recorded.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => submit("confirm")}
        aria-label="Confirm this information is accurate"
      >
        Confirm
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => submit("outdated")}
        aria-label="Mark information as outdated"
      >
        Outdated
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => submit("dispute")}
        aria-label="Dispute this information"
      >
        Dispute
      </Button>
      {error ? (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
