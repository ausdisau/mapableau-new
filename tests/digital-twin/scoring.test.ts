import { describe, expect, it } from "vitest";

import { evaluatePlaceCompatibility } from "@/lib/digital-twin/compatibility";
import {
  DEMO_FEATURES,
  DEMO_PATH_SEGMENTS,
  DEMO_PLACE_CAFE,
  DEMO_PLACE_WORKPLACE,
  DEMO_PROFILE_AAC,
  DEMO_PROFILE_WHEELCHAIR,
} from "@/lib/digital-twin/sample-data";
import {
  calculateConfidence,
  calculateFeatureScore,
  calculateTwinAssessment,
  determineTier,
  getCriticalBarriers,
} from "@/lib/digital-twin/scoring";
import type { TwinEvidence, TwinFeature } from "@/lib/digital-twin/types";

describe("digital twin scoring", () => {
  it("determines tier thresholds correctly", () => {
    expect(determineTier(95)).toBe("gold");
    expect(determineTier(90)).toBe("gold");
    expect(determineTier(75)).toBe("silver");
    expect(determineTier(70)).toBe("silver");
    expect(determineTier(55)).toBe("bronze");
    expect(determineTier(40)).toBe("bronze");
    expect(determineTier(39)).toBe("none");
  });

  it("scores features by level and availability", () => {
    const feature: TwinFeature = {
      id: "f1",
      placeId: "p1",
      featureType: "entrance",
      name: "Entrance",
      availability: "available",
      accessibilityLevel: "gold",
      userImpactTags: [],
      sourceIds: [],
    };
    expect(calculateFeatureScore(feature)).toBe(100);

    const partial: TwinFeature = { ...feature, availability: "partial", accessibilityLevel: "silver" };
    expect(calculateFeatureScore(partial)).toBe(45);
  });

  it("reduces confidence with missing data", () => {
    const features: TwinFeature[] = [
      {
        id: "f1",
        placeId: "p1",
        featureType: "toilet",
        name: "Toilet",
        availability: "unknown",
        accessibilityLevel: "unknown",
        userImpactTags: [],
        sourceIds: [],
      },
    ];
    const evidence: TwinEvidence[] = [];
    expect(calculateConfidence(evidence, features)).toBeLessThan(40);
  });

  it("detects critical barriers", () => {
    const features: TwinFeature[] = [
      {
        id: "f1",
        placeId: "p1",
        featureType: "entrance",
        name: "Entrance",
        availability: "unavailable",
        accessibilityLevel: "fail",
        userImpactTags: [],
        sourceIds: [],
      },
      {
        id: "f2",
        placeId: "p1",
        featureType: "toilet",
        name: "Toilet",
        availability: "unknown",
        accessibilityLevel: "unknown",
        userImpactTags: [],
        sourceIds: [],
      },
    ];
    const barriers = getCriticalBarriers(features);
    expect(barriers).toContain("No accessible entrance");
    expect(barriers.some((b) => b.includes("toilet"))).toBe(true);
  });

  it("calculates twin assessment for demo cafe", () => {
    const cafeFeatures = DEMO_FEATURES.filter((f) => f.placeId === DEMO_PLACE_CAFE.id);
    const assessment = calculateTwinAssessment(DEMO_PLACE_CAFE, cafeFeatures, []);
    expect(assessment.totalScore).toBeGreaterThan(0);
    expect(["none", "bronze", "silver", "gold"]).toContain(assessment.tier);
  });
});

describe("digital twin compatibility", () => {
  it("returns strong match for workplace and wheelchair profile", () => {
    const result = evaluatePlaceCompatibility(
      DEMO_PLACE_WORKPLACE,
      DEMO_FEATURES,
      DEMO_PATH_SEGMENTS,
      DEMO_PROFILE_WHEELCHAIR
    );
    expect(result.compatibilityScore).toBeGreaterThanOrEqual(50);
    expect(result.matchedNeeds.length).toBeGreaterThan(0);
  });

  it("returns partial match for cafe with toilet uncertainty", () => {
    const result = evaluatePlaceCompatibility(
      DEMO_PLACE_CAFE,
      DEMO_FEATURES,
      DEMO_PATH_SEGMENTS,
      DEMO_PROFILE_WHEELCHAIR
    );
    expect(result.unknowns.length + result.barriers.length).toBeGreaterThan(0);
  });

  it("matches communication needs for AAC profile at workplace", () => {
    const result = evaluatePlaceCompatibility(
      DEMO_PLACE_WORKPLACE,
      DEMO_FEATURES,
      DEMO_PATH_SEGMENTS,
      DEMO_PROFILE_AAC
    );
    expect(
      result.matchedNeeds.some((n) => n.toLowerCase().includes("communication") || n.toLowerCase().includes("quiet"))
    ).toBe(true);
  });
});
