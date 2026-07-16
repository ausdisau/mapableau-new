"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Venue = {
  placeId: string;
  name: string;
  address: string;
  fictional: boolean;
  staleEvidenceCount: number;
  disputedFeatureCount: number;
  unknownOpsCount: number;
  activeIncidentCount: number;
};

export function VerifyVenuesClient() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/verify/venues", {
      headers: { "x-access-role": "demo_preview" },
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error ?? "Could not load venues");
          return;
        }
        setVenues(data.venues ?? []);
        setPlanLabel(data.planLabel ?? null);
      })
      .catch(() => setError("Could not load venues"));
  }, []);

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        MapAble Verify demonstration venues are <strong>fictional</strong>. Subscription does not
        make a venue more accessible — it unlocks inventory tools.
      </p>
      {planLabel ? (
        <p className="text-sm text-slate-600">
          Active entitlement plan: <strong>{planLabel}</strong> (demo repository — not a live
          Stripe AI plan).
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      <p>
        <Link
          href="/verify/portfolio"
          className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
        >
          Portfolio overview
        </Link>
      </p>
      <ul className="space-y-4">
        {venues.map((v) => (
          <li key={v.placeId} className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xl font-black text-[#005B7F]">{v.name}</h2>
            <p className="text-slate-700">{v.address}</p>
            <p className="mt-2 text-sm text-slate-600">
              Incidents {v.activeIncidentCount} · Stale evidence {v.staleEvidenceCount} · Disputed{" "}
              {v.disputedFeatureCount} · Unknown ops {v.unknownOpsCount}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/verify/venues/${v.placeId}`}
                className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
              >
                Open inventory
              </Link>
              <Link
                href={`/verify/venues/${v.placeId}/improvements`}
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
              >
                Improvements
              </Link>
              <Link
                href={`/verify/public-guides/${v.placeId}`}
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
              >
                Public guide
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
