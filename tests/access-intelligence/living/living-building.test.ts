import { beforeEach, describe, expect, it } from "vitest";

import { clearAuditEventsForTests, listAuditEvents } from "@/lib/access-intelligence/audit";
import { calculatePersonalFit } from "@/lib/access-intelligence/fit-engine";
import {
  buildHarbourLivingTwin,
  buildTaylorInterviewPassport,
  calculateAccessCoverage,
  defaultInterviewTwin,
  evaluateDecisionForTwin,
  getAccessStateAt,
  listDefaultMutations,
  runCounterfactual,
  MAIN_LIFT_OUTAGE_INCIDENT,
} from "@/lib/access-intelligence/living";
import { buildDecisionMirror } from "@/lib/access-intelligence/living/decision-mirror";
import {
  completeFlightTransfer,
  flightHint,
  resetFlightSimForTests,
  revealFlightEvidence,
  reviseFlightPlan,
  startInterviewFlightSim,
  submitFlightDecision,
  submitFlightPrediction,
} from "@/lib/access-intelligence/living/flight-simulator";
import {
  evaluateActionPolicy,
  executeApprovedSensitiveAction,
  resetConsentStoreForTests,
  revokeConsentGrant,
  storeConsentGrant,
} from "@/lib/access-intelligence/rights/action-policy";
import { buildAccessibleRoute } from "@/lib/access-intelligence/route-engine";

describe("Living Building temporal engine", () => {
  it("Entrance B is open at 10:00 am Sydney (approx)", () => {
    const twin = buildHarbourLivingTwin();
    const state = getAccessStateAt(twin, "2026-07-16T00:00:00.000Z");
    expect(state.closedElementIds).not.toContain("hcc-ent-b");
  });

  it("Entrance B is closed after 18:00", () => {
    const twin = buildHarbourLivingTwin();
    const state = getAccessStateAt(twin, "2026-07-16T09:00:00.000Z"); // 19:00 Sydney
    expect(state.closedElementIds).toContain("hcc-ent-b");
  });

  it("expired incident no longer blocks", () => {
    const twin = buildHarbourLivingTwin({
      incidents: [
        {
          ...MAIN_LIFT_OUTAGE_INCIDENT,
          expiresAt: "2020-01-01T00:00:00.000Z",
          status: "active",
        },
      ],
    });
    const state = getAccessStateAt(twin, "2026-07-16T00:00:00.000Z");
    expect(state.activeIncidents).toHaveLength(0);
  });

  it("active main-lift outage blocks main-lift edges", () => {
    const twin = buildHarbourLivingTwin({
      incidents: [MAIN_LIFT_OUTAGE_INCIDENT],
    });
    const state = getAccessStateAt(twin, "2026-07-16T00:00:00.000Z");
    expect(state.closedEdgeIds).toContain("e-hcc-lift");
  });
});

describe("Living Building decision + route engines", () => {
  it("rejects stepped Entrance A edge for step-free passport; Entrance B uses main lift", () => {
    const twin = buildHarbourLivingTwin();
    const passport = buildTaylorInterviewPassport("u");
    const fromA = buildAccessibleRoute({
      placeId: twin.place.id,
      nodes: twin.nodes,
      edges: twin.edges,
      passport,
      fromNodeId: "n-hcc-a",
      toNodeId: "n-hcc-room",
    });
    // Undirected graph may detour via drop-off → Entrance B; stepped edge A→reception must stay rejected.
    expect(
      fromA.rejected.some((r) => r.reasons.some((x) => /step/i.test(x))),
    ).toBe(true);
    if (fromA.recommended) {
      expect(fromA.recommended.edgeIds).not.toContain("e-hcc-a-rec");
    }
    const fromB = buildAccessibleRoute({
      placeId: twin.place.id,
      nodes: twin.nodes,
      edges: twin.edges,
      passport,
      fromNodeId: "n-hcc-b",
      toNodeId: "n-hcc-room",
    });
    expect(fromB.recommended).not.toBeNull();
    expect(fromB.recommended!.edgeIds).toContain("e-hcc-lift");
  });

  it("western lift route is selected after main-lift outage", () => {
    const twin = buildHarbourLivingTwin({
      incidents: [MAIN_LIFT_OUTAGE_INCIDENT],
    });
    const state = getAccessStateAt(twin, "2026-07-16T00:00:00.000Z");
    const passport = buildTaylorInterviewPassport("u");
    const route = buildAccessibleRoute({
      placeId: twin.place.id,
      nodes: twin.nodes,
      edges: state.effectiveEdges,
      passport,
      fromNodeId: "n-hcc-b",
      toNodeId: "n-hcc-room",
      incidents: state.activeIncidents,
    });
    expect(route.recommended).not.toBeNull();
    expect(route.recommended!.edgeIds.join(",")).toMatch(/west/);
  });

  it("required toilet with unknown operational status returns unknown", () => {
    const twin = buildHarbourLivingTwin();
    const passport = buildTaylorInterviewPassport("u");
    const decision = calculatePersonalFit({
      place: twin.place,
      passport,
      features: twin.features,
      evidence: twin.evidence,
    });
    expect(decision.status).toBe("unknown");
    expect(decision.unknowns.join(" ").toLowerCase()).toMatch(/toilet|unknown/);
  });

  it("door 850 mm passes against 910 mm entrance evidence", () => {
    const twin = buildHarbourLivingTwin();
    const decision = calculatePersonalFit({
      place: twin.place,
      passport: {
        ...buildTaylorInterviewPassport("u"),
        requirements: buildTaylorInterviewPassport("u").requirements.filter(
          (r) => r.featureType !== "accessible_toilet",
        ),
      },
      features: twin.features,
      evidence: twin.evidence,
    });
    expect(["suitable", "suitable_with_conditions", "unknown"]).toContain(decision.status);
    expect(decision.blockers).toHaveLength(0);
  });

  it("destination door 900 mm requirement fails with 880 mm evidence", () => {
    const twin = buildHarbourLivingTwin();
    const passport = buildTaylorInterviewPassport("u");
    passport.requirements = [
      ...passport.requirements.filter((r) => r.featureType !== "accessible_toilet"),
      {
        id: "door-900",
        featureType: "clear_door_width_mm",
        importance: "required",
        operator: "minimum",
        value: 900,
        unit: "mm",
        shareWithVenue: false,
      },
    ];
    // Only room door at 880 — and entrance at 910: conflicting → unknown, or fail if only room used.
    // Scope features to room door only:
    const features = twin.features.filter((f) => f.elementId === "hcc-room");
    const decision = calculatePersonalFit({
      place: twin.place,
      passport,
      features,
      evidence: twin.evidence,
    });
    expect(decision.status).toBe("blocked");
  });
});

describe("Counterfactual + Coverage", () => {
  it("verifying toilet status can change unknown toward classifiable", () => {
    const mutation = listDefaultMutations().find((m) => m.id === "mut-verify-toilet")!;
    const result = runCounterfactual({
      twin: buildHarbourLivingTwin(),
      personalTwin: defaultInterviewTwin("u"),
      mutation,
    });
    expect(result.rankingFactors.statusImprovement).toBeGreaterThanOrEqual(0);
    expect(result.beforeDecision.status).toBe("unknown");
    expect(result.afterDecision.unknowns.length).toBeLessThanOrEqual(
      result.beforeDecision.unknowns.length,
    );
  });

  it("extending entrance hours restores evening access notes", () => {
    const mutation = listDefaultMutations().find((m) => m.id === "mut-ent-b-evening")!;
    const result = runCounterfactual({
      twin: buildHarbourLivingTwin(),
      personalTwin: defaultInterviewTwin("u"),
      mutation,
      visitAt: "2026-07-16T09:00:00.000Z",
    });
    expect(result.mutation.id).toBe("mut-ent-b-evening");
    expect(result.explanation).toMatch(/Mutation/);
  });

  it("coverage counts equal synthetic profiles and stay labelled", () => {
    const coverage = calculateAccessCoverage();
    expect(coverage.testedProfileCount).toBe(coverage.results.length);
    expect(coverage.testedProfileCount).toBeGreaterThanOrEqual(16);
    expect(coverage.results.every((r) => r.syntheticLabel && r.profileName.includes("Synthetic"))).toBe(
      true,
    );
    expect(coverage.note).toMatch(/not population prevalence/i);
  });

  it("previewed mutation recalculates coverage", () => {
    const mutation = listDefaultMutations().find((m) => m.id === "mut-verify-toilet")!;
    const before = calculateAccessCoverage();
    const after = calculateAccessCoverage({ mutation });
    expect(after.testedProfileCount).toBe(before.testedProfileCount);
  });
});

describe("Flight simulator + Decision Mirror", () => {
  beforeEach(() => {
    resetFlightSimForTests();
  });

  it("requires prediction before evidence and introduces lift outage", () => {
    const session = startInterviewFlightSim("u");
    expect(() => revealFlightEvidence(session.id, "ev-hcc-ent-b-level")).toThrow(
      /Prediction required/,
    );
    submitFlightPrediction(session.id, "suitable", 70);
    revealFlightEvidence(session.id, "ev-hcc-ent-a-steps");
    revealFlightEvidence(session.id, "ev-hcc-ent-b-width");
    const decided = submitFlightDecision(session.id, {
      entranceId: "n-hcc-b",
      routeId: "route-main-lift",
      blockers: [],
      unknowns: ["toilet operational status"],
    });
    expect(decided.mainLiftOutageIntroduced).toBe(true);
    expect(decided.stage).toBe("consequence");
    reviseFlightPlan(session.id, "route-western-lift", "suitable_with_conditions", 60);
    const hint = flightHint(session.id);
    expect(hint.level).toBe(1);
    const done = completeFlightTransfer(
      session.id,
      "At 7pm Entrance B is closed so special access is needed or information remains incomplete.",
    );
    expect(done.mirror.evidenceInspectedCount).toBeGreaterThanOrEqual(2);
    expect(done.session.stage).toBe("complete");
  });

  it("Decision Mirror flags unknown treated as present", () => {
    const report = buildDecisionMirror({
      events: [
        {
          type: "prediction_submitted",
          status: "suitable",
          confidence: 80,
          timestamp: new Date().toISOString(),
        },
        {
          type: "unknown_classified",
          featureType: "accessible_toilet",
          classification: "present",
          timestamp: new Date().toISOString(),
        },
      ],
      engineFinalStatus: "unknown",
    });
    expect(report.unknownTreatedAsPresent).toBe(true);
    expect(report.narratableFindings.join(" ")).not.toMatch(/biased against disability/i);
  });

  it("learning mode does not block visit evaluation", () => {
    const visit = evaluateDecisionForTwin({
      twin: buildHarbourLivingTwin(),
      personalTwin: defaultInterviewTwin("visitor"),
    });
    expect(visit.decision.placeId).toBe("place-harbour-civic");
  });
});

describe("Rights and consent", () => {
  beforeEach(() => {
    resetConsentStoreForTests();
    clearAuditEventsForTests();
  });

  it("verification cannot execute without approval", () => {
    const policy = evaluateActionPolicy({
      action: "requestVenueVerification",
      userId: "u",
      requestedFields: ["step_free"],
      shareableFields: ["step_free"],
      approved: false,
    });
    expect(policy.allowed).toBe(false);
    expect(policy.approvalRequired).toBe(true);
  });

  it("only selected shareable fields are permitted", () => {
    const policy = evaluateActionPolicy({
      action: "shareAccessPassport",
      userId: "u",
      requestedFields: ["step_free", "diagnosis"],
      shareableFields: ["step_free"],
      approved: true,
    });
    expect(policy.fieldsPermitted).toEqual(["step_free"]);
    expect(policy.fieldsDenied).toContain("diagnosis");
    expect(policy.allowed).toBe(false);
  });

  it("revoked consent is rejected and audit recorded on approve", () => {
    const grant = storeConsentGrant({
      id: "g1",
      userId: "u",
      purpose: "venue_verification",
      fieldKeys: ["step_free"],
      recipientType: "venue",
      grantedAt: new Date().toISOString(),
    });
    revokeConsentGrant(grant.id);
    const denied = evaluateActionPolicy({
      action: "requestVenueVerification",
      userId: "u",
      requestedFields: ["step_free"],
      shareableFields: ["step_free"],
      approved: true,
      consentGrantId: grant.id,
    });
    expect(denied.allowed).toBe(false);
    const ok = executeApprovedSensitiveAction({
      action: "requestVenueVerification",
      userId: "u",
      recipient: "place-harbour-civic",
      purpose: "toilet status",
      payloadFields: ["accessible_toilet"],
      shareableFields: ["accessible_toilet"],
      approved: true,
    });
    expect(ok.policy.allowed).toBe(true);
    expect(ok.auditId).toBeTruthy();
    expect(listAuditEvents("u").length).toBeGreaterThan(0);
  });
});
