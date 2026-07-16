"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function EventPlannerClient() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulate = async () => {
    setError(null);
    const res = await fetch("/api/access-intelligence/events/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        graph: {
          elements: [
            { id: "gate", type: "entrance", name: "Festival gate" },
            { id: "stage", type: "stage", name: "Main stage" },
          ],
          edges: [
            {
              id: "e1",
              fromElementId: "gate",
              toElementId: "stage",
              widthMm: 700,
              blocked: false,
            },
          ],
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || `Failed (${res.status})`);
      return;
    }
    setResult(data);
  };

  return (
    <div className="space-y-4">
      <p>
        Temporary site graphs are distinct from the permanent AccessPlace
        baseline and from emergency evacuation certification.
      </p>
      <Button
        type="button"
        className={mapableCareFocusRing}
        onClick={() => void simulate()}
      >
        Simulate narrow temporary route
      </Button>
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
