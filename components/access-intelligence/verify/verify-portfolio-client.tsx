"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Venue = {
  placeId: string;
  name: string;
  address: string;
  staleEvidenceCount: number;
  disputedFeatureCount: number;
  unknownOpsCount: number;
  activeIncidentCount: number;
};

export function VerifyPortfolioClient() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/verify/venues?portfolio=1", {
      headers: { "x-access-role": "demo_preview" },
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error ?? "Portfolio unavailable");
          return;
        }
        if (data.portfolioDenied) {
          setError(data.error);
          setPlan(data.planLabel ?? null);
          return;
        }
        setVenues(data.venues ?? []);
        setPlan(data.planLabel ?? null);
      })
      .catch(() => setError("Portfolio unavailable"));
  }, []);

  const gaps = venues.reduce(
    (acc, v) =>
      acc + v.staleEvidenceCount + v.disputedFeatureCount + v.unknownOpsCount + v.activeIncidentCount,
    0,
  );

  return (
    <div className="space-y-6">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
        Portfolio analytics use fictional demonstration venues. Subscription unlocks tools; it does
        not make a venue more accessible.
      </p>
      {plan ? (
        <p className="text-sm text-slate-600">
          Plan: <strong>{plan}</strong>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {!error ? (
        <>
          <p className="text-slate-700">
            Sites {venues.length} · Cross-site gap signals {gaps} (stale + disputed + unknown ops +
            incidents)
          </p>
          <ul className="space-y-3">
            {venues.map((v) => (
              <li key={v.placeId} className="rounded-xl border border-slate-200 p-4">
                <h2 className="font-black text-[#005B7F]">{v.name}</h2>
                <p className="text-sm text-slate-600">{v.address}</p>
                <p className="mt-1 text-sm">
                  Stale {v.staleEvidenceCount} · Disputed {v.disputedFeatureCount} · Unknown ops{" "}
                  {v.unknownOpsCount} · Incidents {v.activeIncidentCount}
                </p>
                <Link
                  href={`/verify/venues/${v.placeId}`}
                  className={`mt-3 inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-black ${mapableCareFocusRing}`}
                >
                  Open venue
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
