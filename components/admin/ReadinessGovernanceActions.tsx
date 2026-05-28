"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ReadinessGovernanceActions() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function applyDeferrals() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/readiness/governance", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error ?? "Failed to apply deferrals");
        return;
      }
      setMessage(`Applied ${data.applied} accepted-risk gap overrides.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-heading text-lg font-semibold">Governance actions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Record accepted-risk disposition for non-blocking v1 gaps (satellite apps,
        transport GPS, stub engines, etc.).
      </p>
      <Button
        type="button"
        className="mt-3"
        variant="outline"
        disabled={loading}
        onClick={applyDeferrals}
      >
        Apply v1 deferral presets
      </Button>
      {message ? <p className="mt-2 text-sm">{message}</p> : null}
    </section>
  );
}
