import { describe, expect, it } from "vitest";

import {
  evaluateAccessDecision,
  evaluateRequirement,
} from "@/lib/access-intelligence/decision-engine";
import { createDemoPassports, getDemoGraph } from "@/lib/access-intelligence/demo-data";
import { calculateRemediationPriority } from "@/lib/access-intelligence/remediation-priority";
import type { AccessFeature, AccessRequirement } from "@/lib/access-intelligence/schemas";

describe("decision-engine", () => {
  it("evaluates required present / absent / unknown", () => {
    const req: AccessRequirement = {
      id: "r1",
      featureType: "step_free",
      importance: "required",
      operator: "available",
      value: true,
      shareWithVenue: true,
    };
    expect(
      evaluateRequirement(req, [
        {
          id: "f",
          placeId: "p",
          elementId: "e",
          featureType: "step_free",
          value: true,
          sourceType: "qualified_assessor",
          observedAt: "2026-06-01T00:00:00.000Z",
          evidenceIds: [],
          confidence: 1,
          disputed: false,
        },
      ]).outcome,
    ).toBe("matched");
    expect(
      evaluateRequirement(req, [
        {
          id: "f",
          placeId: "p",
          elementId: "e",
          featureType: "step_free",
          value: false,
          sourceType: "qualified_assessor",
          observedAt: "2026-06-01T00:00:00.000Z",
          evidenceIds: [],
          confidence: 1,
          disputed: false,
        },
      ]).outcome,
    ).toBe("failed");
    expect(evaluateRequirement(req, [] as AccessFeature[]).outcome).toBe("unknown");
  });

  it("explains hub power-chair decision without using baseline as personal fit", () => {
    const hub = getDemoGraph("place-mapable-community-hub")!;
    const passport = createDemoPassports()[0]!;
    const explained = evaluateAccessDecision({
      place: hub.place,
      passport,
      features: hub.features,
      evidence: hub.evidence,
      incidents: [],
    });
    expect(explained.baselineScore).toBe(hub.place.baselineScore);
    expect(explained.explanationSummary.length).toBeGreaterThan(10);
    expect(["suitable", "suitable_with_conditions", "blocked", "unknown"]).toContain(
      explained.status,
    );
  });

  it("treats no passport as unknown via empty requirements gate in caller", () => {
    const hub = getDemoGraph("place-mapable-community-hub")!;
    const passport = createDemoPassports()[0]!;
    passport.requirements = [];
    const explained = evaluateAccessDecision({
      place: hub.place,
      passport,
      features: hub.features,
      evidence: hub.evidence,
    });
    expect(explained.status).toBe("suitable");
  });
});

describe("remediation priority", () => {
  it("exposes formula and factors", () => {
    const result = calculateRemediationPriority({
      peopleAffected: 50,
      barrierSeverity: 4,
      journeyFrequency: 3,
      evidenceConfidence: 0.8,
      estimatedEffort: 2,
    });
    expect(result.priority).toBeGreaterThan(0);
    expect(result.formula).toContain("peopleAffected");
    expect(result.factors.estimatedEffort).toBe(2);
  });
});
