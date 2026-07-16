"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type RunPayload = {
  building?: { code: string; buildingType: string };
  run?: {
    decisions: Record<string, string>;
    findings: Array<{ code: string; summary: string; severity: string }>;
  };
  releaseEvidence?: { contentHash: string; versionLabel: string };
  result?: { passed?: boolean; ok?: boolean; freshness?: string };
  findings?: Array<{ code: string; summary: string }>;
  error?: string;
};

export function RegressionLabClient() {
  const [output, setOutput] = useState<RunPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/access-intelligence/regression/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as RunPayload;
    setBusy(false);
    if (!res.ok) {
      setError(data.error || `Request failed (${res.status})`);
      setOutput(null);
      return;
    }
    setOutput(data);
  };

  return (
    <div className="space-y-4">
      <p>
        Quality laboratory for synthetic buildings, corridor regressions,
        red-team corpus, and adapter contract modes. Enable with{" "}
        <code>ACCESS_INTELLIGENCE_REGRESSION_SIMULATOR=true</code>.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={() =>
            void post({ action: "run_suite", buildingType: "cafe", seed: "ui" })
          }
        >
          Run café fixture suite
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={() =>
            void post({
              action: "corridor_regression",
              previousWidthMm: 1000,
              nextWidthMm: 700,
            })
          }
        >
          Corridor width regression
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={() =>
            void post({ action: "red_team", code: "diagnosis_inference" })
          }
        >
          Red-team: diagnosis inference
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={() =>
            void post({
              action: "adapter",
              adapterKey: "bms",
              mode: "stale",
            })
          }
        >
          Adapter contract: BMS stale
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {output ? (
        <section aria-labelledby="regression-out">
          <h2 id="regression-out" className="text-xl font-bold">
            Last result
          </h2>
          <pre className="mt-2 overflow-x-auto rounded border p-3 text-sm">
            {JSON.stringify(output, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
