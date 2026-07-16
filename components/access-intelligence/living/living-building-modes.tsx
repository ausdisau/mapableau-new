"use client";

import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { ApprovalCard } from "@/components/access-intelligence/approval-card";
import { EvidenceDrawer } from "@/components/access-intelligence/evidence-list";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

type PassportOption = { id: string; name: string; requirementCount: number };
type DestinationOption = { id: string; label: string; level?: string };

type VisitResult = {
  placeId: string;
  placeName: string;
  statusLabel: string;
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
  routeInstructions: string[];
  rejectedRoutes: Array<{ summary: string; reasons: string[] }>;
  evidenceSummary: Array<{
    id: string;
    title: string;
    sourceType: string;
    sourceName: string;
    capturedAt: string;
    status: string;
    description?: string;
  }>;
  fourMeasures: {
    venueAccessBaseline: number | null;
    personalAccessFit: number | null;
    evidenceConfidence: number;
    liveReliability: number;
  };
  stateNotes: string[];
  personalTwin?: {
    passport: { id: string; name: string };
    journeyContext: {
      purpose: string;
      destination: string;
      visitAt?: string;
      optimisationGoal: string;
    };
  };
};

function roleQuery(rolePreview: string): string {
  if (rolePreview === "visitor") return "";
  return `?role=${encodeURIComponent(rolePreview === "admin" ? "demo_preview" : rolePreview)}`;
}

export function LivingBuildingModes({ placeId }: { placeId: string }) {
  const [visitAt, setVisitAt] = useState("2026-07-16T00:00:00.000Z");
  const [passportId, setPassportId] = useState("passport-power-chair");
  const [destination, setDestination] = useState("Interview Room 3.12");
  const [purpose, setPurpose] = useState("Job interview");
  const [optimisationGoal, setOptimisationGoal] = useState("highest_confidence");
  const [passports, setPassports] = useState<PassportOption[]>([]);
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);
  const [result, setResult] = useState<VisitResult | null>(null);
  const [rolePreview, setRolePreview] = useState("visitor");
  const [error, setError] = useState<string | null>(null);
  const [mapFree, setMapFree] = useState(true);
  const [showApproval, setShowApproval] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const operateHref = useMemo(
    () => `/access-intelligence/operate/${placeId}${roleQuery(rolePreview)}`,
    [placeId, rolePreview],
  );
  const improveHref = useMemo(
    () => `/access-intelligence/improve/${placeId}${roleQuery(rolePreview)}`,
    [placeId, rolePreview],
  );

  useEffect(() => {
    void fetch("/api/access-intelligence/living")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.passports)) setPassports(data.passports);
        if (Array.isArray(data.destinations)) setDestinations(data.destinations);
      })
      .catch(() => undefined);
  }, []);

  const runVisit = useCallback(async () => {
    setError(null);
    setVerifyMessage(null);
    const res = await fetch("/api/access-intelligence/living", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passportId,
        destination,
        visitAt,
        purpose,
        optimisationGoal,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Visit failed");
      return;
    }
    setResult(data);
  }, [passportId, destination, visitAt, purpose, optimisationGoal]);

  useEffect(() => {
    void runVisit();
  }, [runVisit]);

  async function approveVerification() {
    const questions = [
      ...(result?.decision.unknowns ?? []).slice(0, 3),
      "Please confirm current accessible toilet operating status.",
    ];
    const res = await fetch("/api/access-intelligence/actions/request-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approved: true,
        placeId,
        recipient: "Harbour Civic Centre reception (fictional demo)",
        purpose: "venue_verification",
        questions,
      }),
    });
    const data = await res.json();
    setShowApproval(false);
    setVerifyMessage(
      res.ok
        ? `Verification request recorded (${data.request?.id ?? "ok"}). Audit created.`
        : (data.error ?? "Could not send verification request."),
    );
  }

  async function cancelVerification() {
    await fetch("/api/access-intelligence/actions/request-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: false }),
    });
    setShowApproval(false);
    setVerifyMessage("Cancelled — no message was sent to the venue.");
  }

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
              href: `/access-intelligence/learn/interview-level-3`,
              body: "Interview on Level 3 flight simulator — same engines, Decision Mirror, teach-back.",
            },
            {
              title: "Operate it",
              href: operateHref,
              body: "Venue staff: incidents, evidence gaps, temporary routes (role-gated).",
            },
            {
              title: "Improve it",
              href: improveHref,
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
        Role preview is a client convenience for demo mode. Production Operate/Improve APIs
        ignore preview headers and require NextAuth admin or venue staff assignment.
      </p>

      <section id="visit" aria-labelledby="visit-heading" className="space-y-4">
        <h2 id="visit-heading" className="text-2xl font-black">
          Visit it
        </h2>
        <p className="text-slate-700">
          Select an Access Passport and journey context. The language model does not decide
          eligibility — fit and route engines do.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block font-semibold">
            Access Passport
            <select
              className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={passportId}
              onChange={(e) => setPassportId(e.target.value)}
            >
              {(passports.length
                ? passports
                : [{ id: "passport-power-chair", name: "Power-chair access", requirementCount: 0 }]
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-semibold">
            Destination
            <select
              className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              {(destinations.length
                ? destinations
                : [{ id: "room", label: "Interview Room 3.12" }]
              ).map((d) => (
                <option key={d.id} value={d.label}>
                  {d.label}
                  {d.level ? ` (level ${d.level})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-semibold">
            Purpose
            <input
              className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </label>
          <label className="block font-semibold">
            Visit time (ISO)
            <input
              className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={visitAt}
              onChange={(e) => setVisitAt(e.target.value)}
            />
          </label>
          <label className="block font-semibold md:col-span-2">
            Optimisation goal
            <select
              className={`mt-1 w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 font-normal ${mapableCareFocusRing}`}
              value={optimisationGoal}
              onChange={(e) => setOptimisationGoal(e.target.value)}
            >
              <option value="highest_confidence">Highest confidence</option>
              <option value="shortest">Shortest</option>
              <option value="lowest_effort">Lowest effort</option>
              <option value="lowest_sensory_load">Lowest sensory load</option>
            </select>
          </label>
        </div>

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
              Status: {result.statusLabel}
              <span className="sr-only"> ({result.decision.status})</span>
            </p>
            {result.personalTwin ? (
              <p className="text-sm text-slate-600">
                Passport: {result.personalTwin.passport.name} · Destination:{" "}
                {result.personalTwin.journeyContext.destination} · Goal:{" "}
                {result.personalTwin.journeyContext.optimisationGoal.replaceAll("_", " ")}
              </p>
            ) : null}

            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
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
                <dd className="text-xl font-black">{result.fourMeasures.liveReliability}%</dd>
              </div>
            </dl>

            {mapFree ? (
              <div>
                <h3 className="font-black">Ordered text route (Entrance B)</h3>
                {result.routeInstructions?.length ? (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-slate-700">
                    {result.routeInstructions.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-1 text-slate-700">
                    {result.routeSummary ?? "No eligible route from Entrance B at this time."}
                  </p>
                )}
              </div>
            ) : null}

            <div>
              <h3 className="font-black">Rejected alternatives</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                {result.rejectedRoutes?.length
                  ? result.rejectedRoutes.map((r) => (
                      <li key={r.summary} className="rounded-lg border border-slate-200 p-3">
                        <p className="font-semibold">{r.summary}</p>
                        <ul className="mt-1 list-disc pl-5">
                          {r.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </li>
                    ))
                  : (
                    <li>No rejected alternatives recorded.</li>
                  )}
              </ul>
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div>
                <h3 className="font-black">Blockers</h3>
                <ul className="mt-1 list-disc pl-5">
                  {result.decision.blockers.length
                    ? result.decision.blockers.map((b) => <li key={b}>{b}</li>)
                    : (
                      <li>None</li>
                    )}
                </ul>
              </div>
              <div>
                <h3 className="font-black">Conditions</h3>
                <ul className="mt-1 list-disc pl-5">
                  {result.decision.conditions.length
                    ? result.decision.conditions.map((b) => <li key={b}>{b}</li>)
                    : (
                      <li>None</li>
                    )}
                </ul>
              </div>
              <div>
                <h3 className="font-black">Unknowns</h3>
                <ul className="mt-1 list-disc pl-5">
                  {result.decision.unknowns.length
                    ? result.decision.unknowns.map((b) => <li key={b}>{b}</li>)
                    : (
                      <li>None</li>
                    )}
                </ul>
              </div>
            </div>

            {result.stateNotes?.length ? (
              <div>
                <h3 className="font-black">Temporal notes</h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {result.stateNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <EvidenceDrawer
              items={(result.evidenceSummary ?? []).map((e) => ({
                id: e.id,
                title: e.title,
                capturedAt: e.capturedAt,
                sourceName: e.sourceName,
                sourceType: e.sourceType,
                status: e.status,
                description: e.description,
              }))}
            />

            {!showApproval ? (
              <button
                type="button"
                className={`min-h-11 rounded-xl border border-[#005B7F] px-4 font-black text-[#005B7F] ${mapableCareFocusRing}`}
                onClick={() => setShowApproval(true)}
              >
                Request venue verification (requires approval)
              </button>
            ) : (
              <ApprovalCard
                title="Approve venue verification request"
                recipient="Harbour Civic Centre reception (fictional demo)"
                purpose="Confirm unknowns affecting this visit plan"
                durationLabel="24 hours"
                fieldsOrQuestions={[
                  ...(result.decision.unknowns.slice(0, 3).length
                    ? result.decision.unknowns.slice(0, 3)
                    : ["Confirm current accessible toilet operating status."]),
                ]}
                onApprove={() => void approveVerification()}
                onCancel={() => void cancelVerification()}
              />
            )}
            {verifyMessage ? (
              <p role="status" className="text-sm text-slate-700">
                {verifyMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Link
                href="/access-intelligence"
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
              >
                Open Ask Access (optional chat)
              </Link>
              <Link
                href="/access-intelligence/learn/interview-level-3"
                className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-black ${mapableCareFocusRing}`}
              >
                Practice this visit in Learn mode
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
