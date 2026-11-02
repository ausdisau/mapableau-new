import { describe, expect, it } from "vitest";

import type { GaisDemandIndicator } from "@/lib/gais/regional-demand/contracts";
import {
  computeRegionalStrategyScore,
  percentileNormalize,
} from "@/lib/gais/regional-demand/scoring";

function indicator(
  key: GaisDemandIndicator["key"],
  normalizedValue: number,
): GaisDemandIndicator {
  return {
    key,
    rawValue: normalizedValue,
    unit: "index",
    normalizedValue,
    evidence: [
      {
        sourceId: "test",
        publisher: "Test",
        sourceUrl: "https://example.test/source",
        referencePeriod: "2026",
        retrievedAt: "2026-09-18T00:00:00.000Z",
        licenceState: "approved_public_reuse",
        confidence: "high",
      },
    ],
  };
}

describe("regional demand percentile normalization", () => {
  it("preserves missing values and gives ties the same percentile", () => {
    expect(percentileNormalize([10, 20, 20, null, 40])).toEqual([
      0,
      0.5,
      0.5,
      null,
      1,
    ]);
  });
});

describe("regional demand strategy scoring", () => {
  it("is unavailable below 70 percent configured weight coverage", () => {
    const result = computeRegionalStrategyScore([
      indicator("participantScale", 0.8),
      indicator("providerScarcity", 0.7),
    ]);

    expect(result.scoreAvailability).toBe("insufficient_data");
    expect(result.strategyScore).toBeNull();
    expect(result.weightCoverage).toBeCloseTo(0.5);
  });

  it("requires both demand-side and supply-side evidence", () => {
    const result = computeRegionalStrategyScore([
      indicator("participantScale", 0.8),
      indicator("growth", 0.7),
      indicator("paymentIntensity", 0.6),
      indicator("accessNeed", 0.5),
    ]);

    expect(result.weightCoverage).toBeCloseTo(0.7);
    expect(result.scoreAvailability).toBe("insufficient_data");
    expect(result.strategyScore).toBeNull();
  });

  it("renormalizes available weights and reports coverage", () => {
    const result = computeRegionalStrategyScore([
      indicator("participantScale", 0.82),
      indicator("growth", 0.67),
      indicator("providerScarcity", 0.74),
      indicator("paymentIntensity", 0.58),
      indicator("accessNeed", 0.71),
    ]);

    expect(result.weightCoverage).toBeCloseTo(0.9);
    expect(result.scoreAvailability).toBe("available");
    expect(result.strategyScore).toBeCloseTo(0.73);
    expect(result.weightsVersion).toBe("v1");
  });
});
