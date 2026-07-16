import { describe, expect, it } from "vitest";

import { calculateEvidenceConfidence } from "@/lib/access-intelligence/confidence-engine";
import type { AccessFeature } from "@/lib/access-intelligence/schemas";

describe("confidence-engine", () => {
  it("outdated evidence lowers confidence", () => {
    const feature = (observedAt: string): AccessFeature => ({
      id: "f",
      placeId: "p",
      elementId: "e",
      featureType: "accessible_toilet",
      value: true,
      sourceType: "community_report",
      observedAt,
      evidenceIds: [],
      confidence: 0.55,
      disputed: false,
    });
    const now = new Date("2026-07-15T00:00:00.000Z");
    const fresh = calculateEvidenceConfidence({
      features: [feature("2026-06-01T00:00:00.000Z")],
      evidence: [],
      now,
    });
    const stale = calculateEvidenceConfidence({
      features: [feature("2020-01-01T00:00:00.000Z")],
      evidence: [],
      now,
    });
    expect(stale.numeric).toBeLessThan(fresh.numeric);
    expect(stale.label === "limited" || stale.label === "very limited").toBe(true);
  });

  it("conflicting evidence lowers confidence", () => {
    const result = calculateEvidenceConfidence({
      features: [
        {
          id: "a",
          placeId: "p",
          elementId: "e",
          featureType: "clear_door_width_mm",
          value: 900,
          sourceType: "qualified_assessor",
          observedAt: "2026-06-01T00:00:00.000Z",
          evidenceIds: [],
          confidence: 1,
          disputed: false,
        },
        {
          id: "b",
          placeId: "p",
          elementId: "e",
          featureType: "clear_door_width_mm",
          value: 700,
          sourceType: "community_report",
          observedAt: "2026-06-01T00:00:00.000Z",
          evidenceIds: [],
          confidence: 0.55,
          disputed: false,
        },
      ],
      evidence: [],
    });
    expect(result.factors.disputePenalty).toBeLessThan(1);
  });
});
