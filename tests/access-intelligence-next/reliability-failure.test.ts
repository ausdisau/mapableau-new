import { describe, expect, it } from "vitest";

import {
  buildJourneyFailureGraph,
  getReliabilityProfile,
  scanPlaceReliability,
  taylorRoom312Query,
} from "@/lib/access-intelligence-next";

describe("Access reliability profiles", () => {
  it("returns Harbour lift as cannot_forecast with unverified fallback", () => {
    const scan = scanPlaceReliability("harbour_civic");
    expect(scan.productionClaim).toBe("none");
    expect(scan.profiles.length).toBeGreaterThan(0);

    const lift = getReliabilityProfile("harbour_civic.lift_a");
    expect(lift).toBeDefined();
    expect(lift!.reliabilityBand).toBe("cannot_forecast");
    expect(lift!.cannotForecastPreciseProbability).toBe(true);
    expect(lift!.fallbackVerified).toBe(false);
    expect(lift!.limitations.some((l) => /not live/i.test(l))).toBe(true);

    expect(scan.listAlternative.some((a) => a.assetId === "harbour_civic.lift_a")).toBe(
      true,
    );
  });

  it("does not invent precise failure probabilities", () => {
    for (const p of scanPlaceReliability("harbour_civic").profiles) {
      expect(p.cannotForecastPreciseProbability).toBe(true);
      expect(p.modelVersion).toBeNull();
    }
  });
});

describe("Journey failure graph", () => {
  it("marks Lift A as a single point of failure with unknown impact", () => {
    const graph = buildJourneyFailureGraph({
      query: taylorRoom312Query(),
      requirementSetRef: "fixture:taylor-harbour-v1",
    });

    expect(graph.productionClaim).toBe("none");
    expect(graph.overallConclusion).toBe("cannot_confirm");
    expect(graph.overallFragility).toBe("high");
    expect(graph.singlePointsOfFailure.some((s) => /lift/i.test(s))).toBe(true);

    const liftNode = graph.nodes.find((n) => n.assetId === "harbour_civic.lift_a");
    expect(liftNode).toBeDefined();
    expect(liftNode!.hard).toBe(true);
    expect(liftNode!.reliabilityBand).toBe("cannot_forecast");
    expect(liftNode!.impactIfFailed).toBe("unknown_impact");
    expect(liftNode!.status).toBe("unknown");

    expect(graph.listAlternative.length).toBe(graph.nodes.length);
    expect(graph.limitations.some((l) => /not a journey completed/i.test(l))).toBe(true);
    expect(graph.hardDependencies.length).toBeGreaterThan(0);
  });
});
