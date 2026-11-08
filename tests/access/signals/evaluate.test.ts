import { describe, expect, it } from "vitest";

import { evaluateFeature, evaluateRoute } from "@/lib/access/signals/evaluate";
import { makeSyntheticNetwork } from "@/lib/access/signals/network-fixture";
import type {
  RagFeatureAssessmentInput,
  RagObservation,
} from "@/lib/access/signals/types";

function baseFeature(
  overrides: Partial<RagFeatureAssessmentInput> = {},
): RagFeatureAssessmentInput {
  return {
    featureId: "f1",
    label: "Test feature",
    domain: "paths",
    applicability: "applicable",
    critical: false,
    barrierPresent: false,
    observations: [],
    operationalConditions: [],
    ...overrides,
  };
}

function obs(
  flags: RagObservation["flags"],
  id = "o1",
): RagObservation {
  return {
    id,
    featureKey: "width",
    domain: "paths",
    value: 1200,
    observedAt: "2026-01-01T00:00:00.000Z",
    flags,
  };
}

describe("Access Signals RAG evaluator invariants", () => {
  it("1. no evidence ≠ Green", () => {
    expect(evaluateFeature(baseFeature()).status).toBe("unknown");
  });

  it("2. icon/label-style community evidence alone ≠ Green", () => {
    expect(
      evaluateFeature(
        baseFeature({ observations: [obs(["community_reported", "synthetic"])] }),
      ).status,
    ).toBe("unknown");
  });

  it("3. critical unknown blocks route Green", () => {
    const criticalUnknown = baseFeature({
      featureId: "crit",
      critical: true,
      observations: [],
    });
    const greenSeg = baseFeature({
      featureId: "ok",
      observations: [obs(["verified", "assessor_observed"])],
    });
    const results = new Map([
      ["crit", evaluateFeature(criticalUnknown)],
      ["ok", evaluateFeature(greenSeg)],
    ]);
    const inputs = new Map([
      ["crit", criticalUnknown],
      ["ok", greenSeg],
    ]);
    const route = evaluateRoute(
      {
        routeId: "r1",
        label: "r",
        segmentFeatureIds: ["crit", "ok"],
        networkComplete: true,
      },
      results,
      inputs,
    );
    expect(route.status).toBe("unknown");
    expect(route.explanation).toMatch(/critical/i);
  });

  it("4. barrier → segment Red", () => {
    expect(
      evaluateFeature(
        baseFeature({
          barrierPresent: true,
          observations: [obs(["assessor_observed"])],
        }),
      ).status,
    ).toBe("red");
  });

  it("5. verified alternative changes route without clearing barrier", () => {
    const barrier = baseFeature({
      featureId: "barrier",
      barrierPresent: true,
      observations: [obs(["assessor_observed"])],
      verifiedAlternativeIds: ["alt-1"],
    });
    const results = new Map([["barrier", evaluateFeature(barrier)]]);
    const inputs = new Map([["barrier", barrier]]);
    const route = evaluateRoute(
      {
        routeId: "r",
        label: "r",
        segmentFeatureIds: ["barrier"],
        networkComplete: true,
      },
      results,
      inputs,
    );
    expect(route.status).toBe("amber");
    expect(evaluateFeature(barrier).status).toBe("red");
    expect(route.limitations.join(" ")).toMatch(/Original barrier/);
  });

  it("6. Amber only with documented conditions", () => {
    expect(
      evaluateFeature(
        baseFeature({
          observations: [obs(["community_reported"])],
          documentedConditions: ["Assistance available at reception"],
        }),
      ).status,
    ).toBe("amber");
  });

  it("7. no averaging — worst segment wins", () => {
    const green = baseFeature({
      featureId: "g",
      observations: [obs(["verified"])],
    });
    const red = baseFeature({
      featureId: "r",
      barrierPresent: true,
      observations: [obs(["assessor_observed"], "o2")],
    });
    const results = new Map([
      ["g", evaluateFeature(green)],
      ["r", evaluateFeature(red)],
    ]);
    const inputs = new Map([
      ["g", green],
      ["r", red],
    ]);
    expect(
      evaluateRoute(
        {
          routeId: "avg",
          label: "avg",
          segmentFeatureIds: ["g", "r"],
          networkComplete: true,
        },
        results,
        inputs,
      ).status,
    ).toBe("red");
  });

  it("8. NA excluded with reason", () => {
    const result = evaluateFeature(
      baseFeature({
        applicability: "not_applicable",
        notApplicableReason: "Decorative only",
      }),
    );
    expect(result.applicability).toBe("not_applicable");
    expect(result.explanation).toMatch(/Decorative/);
  });

  it("9. stale/disputed triggers reassessment unknown", () => {
    expect(
      evaluateFeature(
        baseFeature({ observations: [obs(["verified", "outdated"])] }),
      ).status,
    ).toBe("unknown");
    expect(
      evaluateFeature(
        baseFeature({ observations: [obs(["disputed", "assessor_observed"])] }),
      ).status,
    ).toBe("unknown");
  });

  it("10. temporary outage separate from permanent barrier", () => {
    const result = evaluateFeature(
      baseFeature({
        observations: [obs(["assessor_observed"])],
        operationalConditions: [
          {
            id: "t1",
            label: "Offline",
            temporary: true,
            kind: "temporary_outage",
          },
        ],
      }),
    );
    expect(result.status).toBe("amber");
    expect(result.limitations.join(" ")).toMatch(/Temporary outages/);
  });

  it("11. AI cannot verify", () => {
    expect(
      evaluateFeature(
        baseFeature({ observations: [obs(["ai_inferred"])] }),
      ).status,
    ).toBe("unknown");
  });

  it("12. deterministic replay", () => {
    const input = baseFeature({
      observations: [obs(["verified", "assessor_observed"])],
    });
    expect(JSON.stringify(evaluateFeature(input))).toBe(
      JSON.stringify(evaluateFeature(input)),
    );
  });

  it("incomplete network → insufficient evidence", () => {
    const network = makeSyntheticNetwork();
    const incomplete = network.routes.find((route) => !route.networkComplete)!;
    const results = new Map(
      network.features.map((feature) => [feature.featureId, evaluateFeature(feature)]),
    );
    const inputs = new Map(
      network.features.map((feature) => [feature.featureId, feature]),
    );
    expect(evaluateRoute(incomplete, results, inputs).status).toBe("unknown");
    expect(evaluateRoute(incomplete, results, inputs).explanation).toMatch(
      /insufficient evidence/i,
    );
  });
});
