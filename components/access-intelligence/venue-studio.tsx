"use client";

import React, { useEffect, useState } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { EvidenceBadge } from "@/components/access-intelligence/evidence-badge";
import { LiveIncidentBanner } from "@/components/access-intelligence/evidence-list";
import { DEMO_PLACES } from "@/lib/access-intelligence/demo-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type DashboardPayload = {
  roleGate: { demoBypass: boolean; note: string; required: string };
  dashboard: {
    place: { id: string; name: string };
    unknownFeatureTypes: string[];
    activeIncidents: Array<{ description: string; type: string }>;
    evidenceGaps: string[];
    remediationHints: Array<{ title: string; reason: string }>;
  };
  remediation: Array<{
    title: string;
    reason: string;
    priority: {
      priority: number;
      formula: string;
      explanation: string;
      factors: Record<string, number>;
    };
  }>;
};

export function VenueStudioClient() {
  const [placeId, setPlaceId] = useState("place-mapable-community-hub");
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setError(null);
      const res = await fetch(
        `/api/access-intelligence/venue/dashboard?placeId=${encodeURIComponent(placeId)}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not load dashboard");
        return;
      }
      setData(json);
    })();
  }, [placeId]);

  return (
    <AccessIntelligenceShell
      title="Venue Studio"
      description="Review accessibility evidence gaps, live incidents, and transparent remediation priorities. Accreditation scores remain separate from personal fit."
    >
      <label className="block max-w-md text-sm font-semibold">
        Place
        <select
          className={`mt-1 w-full min-h-11 rounded-xl border px-3 ${mapableCareFocusRing}`}
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
        >
          {DEMO_PLACES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="mt-6 space-y-6">
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            Role gate: {data.roleGate.required}. Demo bypass is on —{" "}
            {data.roleGate.note}
          </p>

          <LiveIncidentBanner
            message={data.dashboard.activeIncidents[0]?.description ?? null}
          />

          <section aria-labelledby="gaps-heading">
            <h2 id="gaps-heading" className="text-xl font-black">
              Unknown / incomplete fields
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {data.dashboard.unknownFeatureTypes.slice(0, 12).map((t) => (
                <li key={t}>{t.replaceAll("_", " ")}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="gaps2-heading">
            <h2 id="gaps2-heading" className="text-xl font-black">
              Provisional evidence
            </h2>
            <ul className="mt-2 space-y-2">
              {data.dashboard.evidenceGaps.map((g) => (
                <li key={g} className="text-sm">
                  <EvidenceBadge
                    sourceType="venue_attestation"
                    status="provisional"
                  />{" "}
                  {g}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="rem-heading">
            <h2 id="rem-heading" className="text-xl font-black">
              Remediation priorities
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Planning heuristic with editable assumptions — not an objective ranking of
              human need.
            </p>
            <ul className="mt-3 space-y-3">
              {data.remediation.map((item) => (
                <li key={item.title} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-black">
                    {item.title}{" "}
                    <span className="text-sm font-semibold text-slate-600">
                      (priority {item.priority.priority})
                    </span>
                  </p>
                  <p className="mt-1 text-sm">{item.reason}</p>
                  <p className="mt-2 text-xs text-slate-500">{item.priority.formula}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.priority.explanation}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                    {Object.entries(item.priority.factors).map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-semibold text-slate-500">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <p className="mt-4" role="status">
          Loading venue dashboard…
        </p>
      )}
    </AccessIntelligenceShell>
  );
}
