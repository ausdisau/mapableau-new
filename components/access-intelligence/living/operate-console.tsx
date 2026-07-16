"use client";

import React, { useCallback, useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function OperateConsole({ placeId }: { placeId: string }) {
  const [data, setData] = useState<{
    incidents: Array<{ id: string; description: string; status: string; type: string }>;
    evidenceGaps: Array<{ id: string; featureType: string; notes?: string }>;
    disputedClaims: Array<{ id: string; featureType: string }>;
    coverageSummary: Record<string, number>;
    temporaryRoute: { text: string };
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    // demo_preview is honoured only when ACCESS_INTELLIGENCE_DEMO_MODE is on.
    // Production requires NextAuth mapable_admin / provider_admin / AiVenueStaffAssignment.
    const res = await fetch(`/api/access-intelligence/venue/${placeId}/operate`, {
      headers: { "x-access-role": "demo_preview" },
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error ?? "Forbidden");
      return;
    }
    setData(json);
  }, [placeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolveIncident(incidentId: string) {
    const res = await fetch(`/api/access-intelligence/venue/${placeId}/operate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-access-role": "demo_preview",
      },
      body: JSON.stringify({
        incidentId,
        status: "resolved",
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      }),
    });
    const json = await res.json();
    setMessage(
      json.auditId
        ? `Incident updated. Audit ${json.auditId}. ${json.note}`
        : json.error,
    );
    await load();
  }

  if (!data) {
    return <p role="status">{message ?? "Loading operations console…"}</p>;
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-600">
        Venue attestations stay labelled as venue attestations — they do not become assessor
        verification.
      </p>

      <section aria-labelledby="incidents-heading">
        <h2 id="incidents-heading" className="text-xl font-black">
          Active incidents
        </h2>
        <ul className="mt-3 space-y-3">
          {data.incidents.map((inc) => (
            <li key={inc.id} className="rounded-xl border border-slate-200 p-4">
              <p className="font-bold">
                {inc.type.replaceAll("_", " ")} · {inc.status}
              </p>
              <p className="text-slate-700">{inc.description}</p>
              <button
                type="button"
                className={`mt-3 min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-bold ${mapableCareFocusRing}`}
                onClick={() => void resolveIncident(inc.id)}
              >
                Resolve & set expiry
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="gaps-heading">
        <h2 id="gaps-heading" className="text-xl font-black">
          Evidence gaps & disputed claims
        </h2>
        <ul className="mt-3 list-disc pl-5 text-slate-700">
          {data.evidenceGaps.map((g) => (
            <li key={g.id}>
              {g.featureType.replaceAll("_", " ")} — {g.notes ?? "unknown"}
            </li>
          ))}
          {data.disputedClaims.map((d) => (
            <li key={d.id}>{d.featureType.replaceAll("_", " ")} — disputed</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="coverage-ops-heading">
        <h2 id="coverage-ops-heading" className="text-xl font-black">
          Affected synthetic profiles (Access Coverage snapshot)
        </h2>
        <p className="mt-2 text-slate-700">
          Blocked {data.coverageSummary.blocked} · Unknown {data.coverageSummary.unknown} ·
          Suitable {data.coverageSummary.suitable} · With conditions{" "}
          {data.coverageSummary.suitableWithConditions} (of{" "}
          {data.coverageSummary.testedProfileCount})
        </p>
      </section>

      <section aria-labelledby="temp-route-heading">
        <h2 id="temp-route-heading" className="text-xl font-black">
          Temporary western-lift route
        </h2>
        <p className="mt-2 text-slate-700">{data.temporaryRoute.text}</p>
      </section>

      {message ? (
        <p role="status" className="text-slate-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
