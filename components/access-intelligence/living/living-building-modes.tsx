"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type VisitResult = {
  decision: {
    status: string;
    baselineScore: number | null;
    personalFit: number | null;
    evidenceConfidence: number;
    evidenceConfidenceLabel: string;
    liveReliability: number;
    blockers: string[];
    conditions: string[];
    unknowns: string[];
    alternatives: string[];
  };
  routeSummary: string | null;
  fourMeasures: {
    venueAccessBaseline: number | null;
    personalAccessFit: number | null;
    evidenceConfidence: number;
    liveReliability: number;
  };
  stateNotes: string[];
};

export function LivingBuildingModes({ placeId }: { placeId: string }) {
  const [visitAt, setVisitAt] = useState("2026-07-16T00:00:00.000Z");
  const [result, setResult] = useState<VisitResult | null>(null);
  const [rolePreview, setRolePreview] = useState("visitor");
  const [error, setError] = useState<string | null>(null);
  const [mapFree, setMapFree] = useState(true);

  async function runVisit() {
    setError(null);
    const res = await fetch("/api/access-intelligence/living", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passportId: "passport-power-chair",
        destination: "Interview Room 3.12",
        visitAt,
        purpose: "Job interview",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Visit failed");
      return;
    }
    setResult(data);
  }

  useEffect(() => {
    void runVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial visit once
  }, []);

  return (
    <div className="space-y-8">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        Harbour Civic Centre is a clearly <strong>fictional</strong> Living Building.
        Measurements do not represent a real venue and do not declare legal compliance.
      </p>

      <section aria-labelledby="modes-heading">
        <h2 id="modes-heading" className="text-2xl font-black">
          Living Building modes
        </h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            {
              title: "Visit it",
              href: `#visit`,
              body: "Personalised, evidence-backed visit plan using the deterministic engines.",
            },
            {
              title: "Learn it",
              href: `/access-intelligence/learn/scenarios/interview-level-three`,
              body: "Interview on Level 3 flight simulator — same engines, Decision Mirror, teach-back.",
            },
            {
              title: "Operate it",
              href: `/access-intelligence/operate/${placeId}`,
              body: "Venue staff: incidents, evidence gaps, temporary routes (role-gated).",
            },
            {
              title: "Improve it",
              href: `/access-intelligence/improve/${placeId}`,
              body: "Mutation Studio + Access Coverage previews (role-gated).",
            },
          ].map((m) => (
            <li key={m.title}>
              <Link
                href={m.href}
                className={`block rounded-2xl border border-slate-200 p-5 hover:border-[#005B7F] ${mapableCareFocusRing}`}
              >
                <span className="text-lg font-black text-[#005B7F]">{m.title}</span>
                <span className="mt-2 block text-slate-700">{m.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="font-semibold">
          Demo role preview{" "}
          <select
            className={`ml-2 rounded-lg border border-slate-300 px-2 py-1 font-normal ${mapableCareFocusRing}`}
            value={rolePreview}
            onChange={(e) => setRolePreview(e.target.value)}
          >
            <option value="visitor">Visitor</option>
            <option value="venue_staff">Venue staff</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 font-semibold">
          <input
            type="checkbox"
            checked={mapFree}
            onChange={(e) => setMapFree(e.target.checked)}
          />
          Map-free route instructions
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Role preview is a client convenience. Production Operate/Improve APIs still enforce
        server-side role checks when demo mode is off.
      </p>

      <section id="visit" aria-labelledby="visit-heading" className="space-y-4">
        <h2 id="visit-heading" className="text-2xl font-black">
          Visit it — Interview Room 3.12
        </h2>
        <label className="block font-semibold">
          Visit time (ISO)
          <input
            className={`mt-1 w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 font-normal ${mapableCareFocusRing}`}
            value={visitAt}
            onChange={(e) => setVisitAt(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={`min-h-11 rounded-xl bg-[#005B7F] px-4 font-black text-white ${mapableCareFocusRing}`}
          onClick={() => void runVisit()}
        >
          Evaluate access decision
        </button>
        {error ? (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        ) : null}
        {result ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 p-5">
            <p className="text-lg font-black" aria-live="polite">
              Status:{" "}
              {result.decision.status === "unknown"
                ? "Information incomplete"
                : result.decision.status.replaceAll("_", " ")}
            </p>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-500">Venue Access Baseline</dt>
                <dd className="text-xl font-black">
                  {result.fourMeasures.venueAccessBaseline ?? "n/a"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Personal Access Fit</dt>
                <dd className="text-xl font-black">
                  {result.fourMeasures.personalAccessFit ?? "n/a"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Evidence Confidence</dt>
                <dd className="text-xl font-black">
                  {result.fourMeasures.evidenceConfidence}% (
                  {result.decision.evidenceConfidenceLabel})
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-500">Live Reliability</dt>
                <dd className="text-xl font-black">
                  {result.fourMeasures.liveReliability}%
                </dd>
              </div>
            </dl>
            {mapFree && result.routeSummary ? (
              <div>
                <h3 className="font-black">Ordered text route</h3>
                <p className="mt-1 text-slate-700">{result.routeSummary}</p>
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              <div>
                <h3 className="font-black">Blockers</h3>
                <ul className="mt-1 list-disc pl-5">
                  {result.decision.blockers.length
                    ? result.decision.blockers.map((b) => <li key={b}>{b}</li>)
                    : <li>None</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-black">Conditions</h3>
                <ul className="mt-1 list-disc pl-5">
                  {result.decision.conditions.length
                    ? result.decision.conditions.map((b) => <li key={b}>{b}</li>)
                    : <li>None</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-black">Unknowns</h3>
                <ul className="mt-1 list-disc pl-5">
                  {result.decision.unknowns.length
                    ? result.decision.unknowns.map((b) => <li key={b}>{b}</li>)
                    : <li>None</li>}
                </ul>
              </div>
            </div>
            <Link
              href="/access-intelligence"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
            >
              Open Ask Access (Plan) without a lesson
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
