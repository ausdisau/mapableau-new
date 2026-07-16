"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function GuideComposerClient() {
  const [html, setHtml] = useState<string | null>(null);
  const [refs, setRefs] = useState<unknown[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bind = async (sections: unknown[]) => {
    setError(null);
    const res = await fetch("/api/access-intelligence/guides/bind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Riverside Hall access guide",
        plainLanguage: true,
        sections,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || `Failed (${res.status})`);
      setHtml(null);
      setRefs(null);
      return;
    }
    setHtml(data.html);
    setRefs(data.evidenceReferences);
  };

  return (
    <div className="space-y-4">
      <p>
        Every factual sentence must bind to approved evidence. Unknowns stay
        unknown. No legal compliance claims.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className={mapableCareFocusRing}
          onClick={() =>
            void bind([
              {
                heading: "Entrance",
                facts: [
                  {
                    sentenceKey: "ent-1",
                    text: "The River Street entrance is step-free.",
                    evidenceLabel: "Assessor photo 2026-01-15",
                    evidenceAssetId: "ea-1",
                    sourceKind: "assessor",
                  },
                  {
                    sentenceKey: "ent-2",
                    text: "Lift operating state is unknown.",
                    evidenceLabel: "No live feed",
                    sourceKind: "unknown",
                  },
                ],
              },
            ])
          }
        >
          Bind valid guide draft
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          onClick={() =>
            void bind([
              {
                heading: "Entrance",
                facts: [
                  {
                    sentenceKey: "bad-1",
                    text: "This venue is fully compliant with disability standards.",
                    evidenceLabel: "None",
                    evidenceAssetId: "ea-x",
                    sourceKind: "venue_attestation",
                  },
                ],
              },
            ])
          }
        >
          Reject compliance claim
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {refs ? (
        <p role="status">Evidence references: {refs.length}</p>
      ) : null}
      {html ? (
        <iframe
          title="Guide preview"
          className="h-64 w-full rounded border bg-white"
          srcDoc={html}
        />
      ) : null}
    </div>
  );
}
