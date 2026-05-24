"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface LinkedIdentity {
  id: string;
  auth0UserId: string;
  provider: string;
  email: string | null;
  linkedAt: string;
}

export function LinkedAccountsPanel({
  identities,
}: {
  identities: LinkedIdentity[];
}) {
  const [items, setItems] = useState(identities);
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function unlink(linkId: string) {
    setError("");
    setLoadingId(linkId);

    try {
      const response = await fetch("/api/auth/unlink-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not unlink identity.");
        return;
      }

      setItems((current) => current.filter((item) => item.id !== linkId));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3" aria-label="Linked sign-in methods">
        {items.map((identity) => (
          <li
            key={identity.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{identity.provider}</p>
              <p className="text-sm text-muted-foreground">{identity.email}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={loadingId === identity.id}
              disabled={items.length <= 1}
              onClick={() => unlink(identity.id)}
            >
              Unlink
            </Button>
          </li>
        ))}
      </ul>

      {items.length <= 1 && (
        <p className="text-sm text-muted-foreground">
          You must keep at least one sign-in method linked to your MapAble profile.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
