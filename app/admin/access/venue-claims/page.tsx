"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Claim = {
  id: string;
  status: string;
  businessName: string | null;
  place: { id: string; name: string };
  user: { id: string; name: string; email: string };
};

export default function AdminVenueClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/access/venue-claims")
      .then((r) => r.json())
      .then((d) => setClaims(d.claims ?? []))
      .catch(() => setError("Could not load claims"));
  }, []);

  async function act(claimId: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/access/venue-claims", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId, action }),
    });
    if (!res.ok) {
      setError("Action failed");
      return;
    }
    setClaims((c) => c.filter((x) => x.id !== claimId));
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Venue claims</h1>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-4">
        {claims.map((claim) => (
          <li key={claim.id} className="rounded-lg border p-4">
            <p className="font-medium">{claim.place.name}</p>
            <p className="text-sm">
              {claim.user.name} ({claim.user.email})
            </p>
            {claim.businessName ? (
              <p className="text-sm text-muted-foreground">{claim.businessName}</p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="default" onClick={() => act(claim.id, "approve")}>
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => act(claim.id, "reject")}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
