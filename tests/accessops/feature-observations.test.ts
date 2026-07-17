import { describe, expect, it } from "vitest";

import { projectCurrentFeatureObservations } from "@/lib/accessops/features/observation-service";

describe("AccessOps feature observations", () => {
  it("keeps latest non-rejected observation per feature", () => {
    const observations = projectCurrentFeatureObservations([
      {
        assetId: "asset-1",
        featureType: "lift_access",
        observedValue: { value: false },
        observedAt: new Date("2026-01-01T00:00:00Z"),
        validUntil: null,
        confidence: 0.4,
        isInferred: false,
        verificationStatus: "unverified",
      },
      {
        assetId: "asset-1",
        featureType: "lift_access",
        observedValue: { value: true },
        observedAt: new Date("2026-01-02T00:00:00Z"),
        validUntil: null,
        confidence: 0.9,
        isInferred: false,
        verificationStatus: "verified",
      },
    ]);
    expect(observations).toHaveLength(1);
    expect(observations[0]?.confidence).toBe(0.9);
  });
});
