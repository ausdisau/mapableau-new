"use client";

import { useState } from "react";

type SeedResult = {
  correlationId: string;
  assetCount: number;
  mode: string;
  publicObservatory: boolean;
  liveIncidents: boolean;
  simulation: boolean;
  participantJourneyAccess: boolean;
};

export function PilotSeedPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeedResult | null>(null);

  async function onSeed() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/civic/pilot/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await response.json()) as SeedResult & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 rounded border p-4">
      <p className="text-sm text-muted-foreground">
        Seeds a synthetic Harbour precinct (interchange, civic building, clinic,
        community hub, paths, curb zones, toilet, Changing Places). Does not
        publish a public Observatory or touch participant journeys.
      </p>
      <button
        type="button"
        className="rounded border px-3 py-2 text-sm font-medium disabled:opacity-50"
        onClick={onSeed}
        disabled={loading}
      >
        {loading ? "Seeding…" : "Seed Harbour precinct pilot"}
      </button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Assets</dt>
            <dd>{result.assetCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Mode</dt>
            <dd>{result.mode}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Correlation ID</dt>
            <dd className="font-mono text-xs">{result.correlationId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Public Observatory</dt>
            <dd>{result.publicObservatory ? "on" : "off"}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}
