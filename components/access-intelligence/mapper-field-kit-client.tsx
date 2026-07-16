"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function MapperFieldKitClient() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (body: Record<string, unknown>) => {
    setError(null);
    const res = await fetch("/api/access-intelligence/mapper/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
      <ul className="list-disc space-y-2 pl-5">
        <li>No facial, disability, emotion, or cognitive-capacity recognition</li>
        <li>Temporary image retention by default</li>
        <li>Observed vs estimated classification required</li>
        <li>Contribution points never change confidence</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className={mapableCareFocusRing}
          onClick={() =>
            void submit({
              pathwayLevel: "new_contributor",
              evidenceType: "community_observation",
              payload: {
                elementType: "entrance",
                observedVsEstimated: "observed",
                imageConsent: false,
                accessPlaceId: "place-demo",
              },
              baseConfidence: 0.55,
              contributionPoints: 120,
              badges: 3,
            })
          }
        >
          Validate observation draft
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          onClick={() =>
            void submit({
              pathwayLevel: "new_contributor",
              evidenceType: "measurement",
              payload: {
                elementType: "door",
                observedVsEstimated: "estimated",
                imageConsent: false,
              },
              contributionPoints: 999,
            })
          }
        >
          Reject gated measurement
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
      <p className="text-sm">
        Flags: <code>ACCESS_INTELLIGENCE_MAPPER_FIELD_KIT</code>,{" "}
        <code>ACCESS_INTELLIGENCE_CONTRIBUTOR_PATHWAY</code>
      </p>
    </div>
  );
}
