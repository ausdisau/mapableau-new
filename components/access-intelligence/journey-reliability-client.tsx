"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

const DEMO_VISIT_PLAN = {
  id: "vp-demo-lift",
  userId: "demo-user",
  placeId: "place-riverside-hall",
  destination: "Meeting Room 2.1",
  visitAt: new Date(Date.now() + 86_400_000).toISOString(),
  accessDecision: {
    placeId: "place-riverside-hall",
    status: "suitable_with_conditions",
    baselineScore: 0.8,
    personalFit: 0.75,
    evidenceConfidence: 70,
    evidenceConfidenceLabel: "moderate",
    liveReliability: 60,
    blockers: [],
    conditions: ["Confirm lift before departure"],
    unknowns: ["lift live state"],
    matchedRequirements: [],
    alternatives: ["Ground-floor alternate room"],
    evidenceIds: [],
    recommendedRouteId: null,
    generatedAt: new Date().toISOString(),
  },
  route: null,
  arrivalInstructions: [
    "Arrive at accessible entrance on River Street",
    "Take lift to level 2",
    "Meeting Room 2.1 is on the left",
  ],
  contingencyInstructions: [
    "If lift is out, use alternate entrance and ground-floor room",
  ],
  evidenceSummary: ["Assessor door width 2026-01-15"],
  lastCheckedAt: new Date().toISOString(),
};

export function JourneyReliabilityClient() {
  const [preflight, setPreflight] = useState<{
    findings: Array<{ code: string; severity: string; message: string }>;
    blockerCount: number;
  } | null>(null);
  const [proposal, setProposal] = useState<{
    proposalHash: string;
    summary: string;
    requiresApproval: boolean;
  } | null>(null);
  const [packHtml, setPackHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/access-intelligence/journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || `Failed (${res.status})`);
      return null;
    }
    return data;
  };

  return (
    <div className="space-y-6">
      <p>
        Scenario A: lift outage → alternate route proposal → offline pack update →
        approval before booking change. Flags:{" "}
        <code>JOURNEY_PREFLIGHT</code>, <code>JOURNEY_GUARDIAN</code>,{" "}
        <code>OFFLINE_VISIT_PACK</code>.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={async () => {
            const data = await post({
              action: "preflight",
              visitPlan: DEMO_VISIT_PLAN,
              liftAvailable: false,
              transportBookingStatus: "confirmed",
              toiletOperating: true,
              evidenceStaleFeatureTypes: ["lift"],
            });
            if (data?.result) setPreflight(data.result);
          }}
        >
          Run preflight (lift outage)
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={async () => {
            const data = await post({
              action: "recover",
              disruptionType: "lift_outage",
              visitPlan: DEMO_VISIT_PLAN,
              revisedRouteSummary: {
                distanceDeltaMetres: 120,
                timeDeltaMinutes: 8,
                confidenceDelta: -0.05,
              },
            });
            if (data?.proposal) setProposal(data.proposal);
          }}
        >
          Propose recovery
        </Button>
        <Button
          type="button"
          variant="outline"
          className={mapableCareFocusRing}
          disabled={busy}
          onClick={async () => {
            const data = await post({
              action: "offline_pack",
              visitPlan: {
                ...DEMO_VISIT_PLAN,
                contingencyInstructions: [
                  ...DEMO_VISIT_PLAN.contingencyInstructions,
                  "Use ground-floor alternate room if lift is out",
                ],
              },
              placeName: "Riverside Hall",
              facilities: ["Accessible toilet level 1", "Hearing loop"],
              fallbackRoute: [
                "Enter via River Street accessible door",
                "Stay on ground floor — Room G.04",
              ],
              contacts: ["Venue assistance: 1800 000 000"],
              unknowns: ["Lift live state"],
              evidenceDates: ["Door width assessed 2026-01-15"],
              plainLanguage: true,
            });
            if (data?.pack?.contentHtml) setPackHtml(data.pack.contentHtml);
          }}
        >
          Generate offline pack
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {preflight ? (
        <section aria-labelledby="preflight-h">
          <h2 id="preflight-h" className="text-xl font-bold">
            Preflight findings ({preflight.blockerCount} blockers)
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {preflight.findings.map((f, i) => (
              <li key={`${f.code}-${i}`}>
                [{f.severity}] {f.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {proposal ? (
        <section aria-labelledby="recovery-h">
          <h2 id="recovery-h" className="text-xl font-bold">
            Recovery proposal
          </h2>
          <p>{proposal.summary}</p>
          <p>
            Hash: <code>{proposal.proposalHash}</code>
          </p>
          <p role="status">Approval required before rebooking or disclosure.</p>
        </section>
      ) : null}
      {packHtml ? (
        <section aria-labelledby="pack-h">
          <h2 id="pack-h" className="text-xl font-bold">
            Offline visit pack preview
          </h2>
          <iframe
            title="Offline visit pack"
            className="mt-2 h-80 w-full rounded border bg-white"
            srcDoc={packHtml}
          />
        </section>
      ) : null}
    </div>
  );
}
