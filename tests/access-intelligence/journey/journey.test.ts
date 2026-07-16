import { describe, expect, it } from "vitest";

import {
  buildRecoveryProposal,
  renderOfflineVisitPack,
  runVisitPreflight,
} from "@/lib/access-intelligence/journey";
import type { VisitPlan } from "@/lib/access-intelligence/schemas";

const plan: VisitPlan = {
  id: "vp1",
  userId: "u1",
  placeId: "place-1",
  destination: "Interview room",
  accessDecision: {
    placeId: "place-1",
    status: "suitable",
    baselineScore: null,
    personalFit: 80,
    evidenceConfidence: 70,
    evidenceConfidenceLabel: "moderate",
    liveReliability: 80,
    blockers: [],
    unknowns: [],
    conditions: [],
    matchedRequirements: [],
    alternatives: [],
    evidenceIds: [],
    recommendedRouteId: null,
    generatedAt: new Date().toISOString(),
  },
  route: null,
  arrivalInstructions: ["Enter via ramp"],
  contingencyInstructions: [],
  evidenceSummary: [],
  lastCheckedAt: new Date().toISOString(),
};

describe("System 2 journey reliability", () => {
  it("flags lift outage as preflight blocker", () => {
    const result = runVisitPreflight({
      visitPlan: plan,
      liftAvailable: false,
      transportBookingStatus: "confirmed",
    });
    expect(result.blockerCount).toBeGreaterThan(0);
    expect(result.findings.some((f) => f.code === "lift_state")).toBe(true);
  });

  it("builds approval-gated recovery proposals with stable hashes", () => {
    const a = buildRecoveryProposal({
      disruptionType: "lift_outage",
      originalPlan: plan,
      revisedRouteSummary: { distanceDeltaMetres: 100, timeDeltaMinutes: 5 },
    });
    const b = buildRecoveryProposal({
      disruptionType: "lift_outage",
      originalPlan: plan,
      revisedRouteSummary: { distanceDeltaMetres: 100, timeDeltaMinutes: 5 },
    });
    expect(a.requiresApproval).toBe(true);
    expect(a.proposalHash).toBe(b.proposalHash);
  });

  it("renders offline visit pack HTML with unknowns", () => {
    const pack = renderOfflineVisitPack({
      visitPlan: plan,
      placeName: "Civic Hall",
      facilities: ["Accessible toilet"],
      contacts: ["Venue assistance"],
      unknowns: ["Lift status unknown"],
      evidenceDates: ["Door width: 2026-01-01"],
      plainLanguage: true,
    });
    expect(pack.contentHtml).toContain("Unresolved unknowns");
    expect(pack.contentHtml).toContain("Lift status unknown");
  });
});
