"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function RegionalTowerClient() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (withBanned = false) => {
    setError(null);
    const res = await fetch("/api/access-intelligence/regional/signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        withBanned
          ? { hubId: "hub-west", worthiness: 0.9, cells: [] }
          : {
              hubId: "hub-west",
              threshold: 5,
              cells: [
                {
                  key: "sa2-a",
                  count: 12,
                  gapCodes: ["transport_unavailable", "no_capacity"],
                },
                {
                  key: "sa2-b",
                  count: 3,
                  gapCodes: ["venue_access_unknown"],
                },
                {
                  key: "sa2-c",
                  count: 8,
                  gapCodes: ["no_combined_care_transport"],
                },
              ],
            },
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || `Failed (${res.status})`);
      setResult(null);
      return;
    }
    setResult(data);
  };

  return (
    <div className="space-y-4">
      <ul className="list-disc space-y-2 pl-5">
        <li>
          Distinguishes no provider vs no capacity vs transport vs venue
          evidence gaps
        </li>
        <li>No participant ranking or worthiness scores</li>
        <li>Demand signals clearly labelled vs verified unmet need</li>
        <li>Small-cell suppression (default n&lt;5)</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className={mapableCareFocusRing}
          onClick={() => void run(false)}
        >
          Compute thin-market signals
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          onClick={() => void run(true)}
        >
          Reject ranking payload
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {result ? (
        <pre className="overflow-x-auto rounded border p-3 text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
