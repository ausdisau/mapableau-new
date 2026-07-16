"use client";

import { useState } from "react";

type SeedResponse = {
  correlationId: string;
  blocking: boolean;
  assets: Record<string, { id: string; title: string; stableKey: string }>;
  evaluations: Array<{
    evaluationId: string;
    assetId: string;
    results: Array<{ outcome: string; ruleStableKey: string }>;
  }>;
};

export function PilotSeedPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SeedResponse | null>(null);

  async function onSeed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accessibility-ops/pilot/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Seed failed");
      }
      setResult(data as SeedResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onSeed}
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
      >
        {loading ? "Seeding pilot…" : "Seed shadow pilot assets"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="space-y-3 text-sm" aria-live="polite">
          <p>
            Seeded with correlation <code>{result.correlationId}</code>. Blocking:{" "}
            {String(result.blocking)}.
          </p>
          <h3 className="font-semibold">Assets</h3>
          <ul className="list-disc space-y-1 pl-5">
            {Object.values(result.assets).map((a) => (
              <li key={a.id}>
                <a className="underline" href={`/accessibility-ops/assets/${a.id}`}>
                  {a.title}
                </a>{" "}
                <span className="text-muted-foreground">({a.stableKey})</span>
              </li>
            ))}
          </ul>
          <h3 className="font-semibold">Shadow evaluations</h3>
          <ul className="list-disc space-y-1 pl-5">
            {result.evaluations.map((ev) => (
              <li key={ev.evaluationId}>
                Asset {ev.assetId}:{" "}
                {ev.results.map((r) => `${r.ruleStableKey}=${r.outcome}`).join("; ") ||
                  "no applicable rules"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
