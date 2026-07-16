"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Inventory = {
  placeId: string;
  placeName: string;
  fictionalNotice: string;
  elements: Array<{ id: string; type: string; name: string; level?: string }>;
  staleEvidence: Array<{ id: string; title: string; capturedAt: string }>;
  disputedFeatures: Array<{ id: string; featureType: string }>;
  unknownFeatures: Array<{ id: string; featureType: string; notes?: string }>;
  incidents: Array<{ id: string; type: string; description: string; status: string }>;
  coverage: {
    testedProfileCount: number;
    suitable: number;
    unknown: number;
    blocked: number;
    suitableWithConditions: number;
  };
  temporaryRoute?: { text: string };
};

export function VerifyVenueDetailClient({ placeId }: { placeId: string }) {
  const [data, setData] = useState<Inventory | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attestText, setAttestText] = useState(
    "Accessible toilet operating as of this morning (venue attestation).",
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/verify/venues/${placeId}/inventory`, {
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

  async function addAttestation() {
    const res = await fetch(`/api/verify/venues/${placeId}/attestations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-role": "demo_preview",
      },
      body: JSON.stringify({
        featureType: "toilet_operational_status",
        statement: attestText,
        elementId: "hcc-toilet-2",
      }),
    });
    const json = await res.json();
    setMessage(
      res.ok
        ? `Attestation ${json.attestation?.id} saved as venue_attestation (not assessor verification). Audit ${json.auditId}.`
        : json.error,
    );
  }

  if (!data) {
    return <p role="status">{message ?? "Loading inventory…"}</p>;
  }

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">{data.fictionalNotice}</p>

      <nav className="flex flex-wrap gap-3 text-sm font-bold" aria-label="Venue sections">
        <Link href={`/verify/venues/${placeId}/evidence`} className={mapableCareFocusRing}>
          Evidence
        </Link>
        <Link href={`/verify/venues/${placeId}/incidents`} className={mapableCareFocusRing}>
          Incidents
        </Link>
        <Link href={`/verify/venues/${placeId}/requests`} className={mapableCareFocusRing}>
          Requests
        </Link>
        <Link href={`/verify/venues/${placeId}/improvements`} className={mapableCareFocusRing}>
          Improvements
        </Link>
        <Link href={`/verify/public-guides/${placeId}`} className={mapableCareFocusRing}>
          Public guide
        </Link>
        <Link href={`/access-intelligence/operate/${placeId}?role=demo_preview`} className={mapableCareFocusRing}>
          Operate
        </Link>
        <Link href={`/access-intelligence/buildings/${placeId}`} className={mapableCareFocusRing}>
          Living Building
        </Link>
      </nav>

      <section>
        <h2 className="text-xl font-black">Building elements</h2>
        <ul className="mt-2 grid gap-2 md:grid-cols-2">
          {data.elements.map((e) => (
            <li key={e.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <span className="font-semibold">{e.name}</span> · {e.type}
              {e.level ? ` · L${e.level}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black">Active incidents</h2>
        <ul className="mt-2 space-y-2">
          {data.incidents.length ? (
            data.incidents.map((i) => (
              <li key={i.id} className="rounded-lg border p-3 text-sm">
                <strong>{i.type.replaceAll("_", " ")}</strong> · {i.status}
                <p>{i.description}</p>
              </li>
            ))
          ) : (
            <li>No incidents on this twin snapshot.</li>
          )}
        </ul>
        {data.temporaryRoute ? (
          <p className="mt-3 text-sm text-slate-700">
            Temporary western-lift route: {data.temporaryRoute.text}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="text-xl font-black">Stale evidence · disputes · unknowns</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          {data.staleEvidence.map((e) => (
            <li key={e.id}>
              Stale: {e.title} ({e.capturedAt.slice(0, 10)})
            </li>
          ))}
          {data.disputedFeatures.map((f) => (
            <li key={f.id}>Disputed: {f.featureType.replaceAll("_", " ")}</li>
          ))}
          {data.unknownFeatures.map((f) => (
            <li key={f.id}>
              Unknown: {f.featureType.replaceAll("_", " ")} — {f.notes ?? "ops unknown"}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black">Access Coverage (synthetic profiles)</h2>
        <p className="mt-2 text-slate-700">
          {data.coverage.testedProfileCount} profiles · Suitable {data.coverage.suitable} ·
          Conditions {data.coverage.suitableWithConditions} · Unknown {data.coverage.unknown} ·
          Blocked {data.coverage.blocked}
        </p>
        <p className="text-xs text-slate-500">Synthetic test profiles — not population prevalence.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xl font-black">Add venue attestation</h2>
        <p className="text-sm text-slate-600">
          Remains labelled <code>venue_attestation</code> — never becomes assessor verification.
        </p>
        <textarea
          className={`mt-3 min-h-24 w-full rounded-xl border px-3 py-2 ${mapableCareFocusRing}`}
          value={attestText}
          onChange={(e) => setAttestText(e.target.value)}
        />
        <button
          type="button"
          className={`mt-3 min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() => void addAttestation()}
        >
          Save attestation
        </button>
      </section>

      {message ? (
        <p role="status" className="text-slate-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
