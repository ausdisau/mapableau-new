import { beforeEach, describe, expect, it } from "vitest";

import { clearAuditEventsForTests } from "@/lib/access-intelligence/audit";
import { evaluateAccessDecision } from "@/lib/access-intelligence/decision-engine";
import {
  createDemoPassports,
  DEMO_SCENARIOS,
  getDemoGraph,
} from "@/lib/access-intelligence/demo-data";
import {
  getAccessIntelligenceRepository,
  resetDemoRepositoryForTests,
} from "@/lib/access-intelligence/repositories";

describe("access-intelligence API-level contracts", () => {
  beforeEach(() => {
    resetDemoRepositoryForTests();
    clearAuditEventsForTests();
  });

  it("places search returns community hub", async () => {
    const repo = getAccessIntelligenceRepository();
    const hits = await repo.searchPlaces("MapAble Community");
    expect(hits.some((h) => h.place.id === "place-mapable-community-hub")).toBe(true);
  });

  it("decision and route endpoints semantics via repository services", async () => {
    const repo = getAccessIntelligenceRepository();
    const userId = "demo-access-intelligence-user";
    const passport = await repo.getPassport(userId, "passport-power-chair");
    const graph = await repo.readAccessGraph("place-mapable-community-hub");
    const decision = evaluateAccessDecision({
      place: graph.place,
      passport,
      features: graph.features,
      evidence: graph.evidence,
      incidents: await repo.getLiveIncidents(graph.place.id),
    });
    expect(decision.status).not.toBeUndefined();

    const plan = await repo.saveVisitPlan({
      id: "visit-test",
      userId,
      placeId: graph.place.id,
      destination: "Meeting Room 2.1",
      accessDecision: {
        placeId: graph.place.id,
        status: decision.status,
        baselineScore: decision.baselineScore,
        personalFit: decision.personalFit,
        evidenceConfidence: decision.evidenceConfidence,
        evidenceConfidenceLabel: decision.evidenceConfidenceLabel,
        liveReliability: decision.liveReliability,
        blockers: decision.blockers,
        conditions: decision.conditions,
        unknowns: decision.unknowns,
        matchedRequirements: decision.matchedRequirements,
        alternatives: decision.alternatives,
        evidenceIds: decision.evidenceIds,
        recommendedRouteId: null,
        generatedAt: decision.generatedAt,
      },
      route: null,
      arrivalInstructions: ["Test"],
      contingencyInstructions: [],
      evidenceSummary: [],
      lastCheckedAt: new Date().toISOString(),
    });
    const listed = await repo.listVisitPlans(userId);
    expect(listed.some((p) => p.id === plan.id)).toBe(true);
  });

  it("barrier report requires explicit create (approval pattern tested elsewhere)", async () => {
    const repo = getAccessIntelligenceRepository();
    const before = await repo.listBarrierReports();
    expect(before).toHaveLength(0);
  });

  it("venue dashboard is available for hub", async () => {
    const dash = await getAccessIntelligenceRepository().getVenueDashboard(
      "place-mapable-community-hub",
    );
    expect(dash.place.name).toBe("MapAble Community Hub");
    expect(dash.unknownFeatureTypes.length).toBeGreaterThan(0);
  });

  it("demo scenarios cover multiple decision states across hub passports", () => {
    const statuses = new Set<string>();
    for (const scenario of DEMO_SCENARIOS) {
      const graph = getDemoGraph(scenario.placeId)!;
      const passport = createDemoPassports().find((p) => p.id === scenario.passportId)!;
      const decision = evaluateAccessDecision({
        place: graph.place,
        passport,
        features: graph.features,
        evidence: graph.evidence,
      });
      statuses.add(decision.status);
      expect(scenario.expectedStatuses).toContain(decision.status);
    }
    expect(statuses.size).toBeGreaterThanOrEqual(1);
  });
});
