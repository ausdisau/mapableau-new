import { describe, expect, it } from "vitest";

import {
  computeConfidenceScore,
  computeDomainScoresFromRatings,
  ratingToPercent,
} from "@/lib/access-markers/scoring";

describe("access marker scoring", () => {
  it("converts 1–5 ratings to percent and ignores unknown", () => {
    expect(ratingToPercent(5)).toBe(100);
    expect(ratingToPercent(4)).toBe(80);
    expect(ratingToPercent(0)).toBeNull();
    expect(ratingToPercent(null)).toBeNull();
  });

  it("averages known domain scores and ignores zeros", () => {
    const scores = computeDomainScoresFromRatings([
      {
        visitedInPerson: true,
        overallRating: 0,
        mobilityRating: 4,
        toiletRating: 5,
        parkingDropoffRating: 0,
        sensoryRating: 3,
        communicationRating: null,
        staffServiceRating: 4,
      },
      {
        visitedInPerson: true,
        mobilityRating: 5,
        toiletRating: 4,
        sensoryRating: 0,
        staffServiceRating: 5,
      },
    ]);

    expect(scores.mobilityScore).toBe(90);
    expect(scores.toiletScore).toBe(90);
    expect(scores.parkingDropoffScore).toBe(0);
    expect(scores.sensoryScore).toBe(60);
    expect(scores.staffServiceScore).toBe(90);
    expect(scores.overallScore).toBeGreaterThan(0);
  });

  it("increases confidence with ratings and verifications", () => {
    const low = computeConfidenceScore({
      ratingCount: 1,
      verifiedCount: 0,
      disputedCount: 0,
      lastRatedAt: new Date(),
    });
    const high = computeConfidenceScore({
      ratingCount: 5,
      verifiedCount: 4,
      disputedCount: 0,
      photoCount: 2,
      lastRatedAt: new Date(),
    });
    expect(high).toBeGreaterThan(low);
  });

  it("penalises open disputes", () => {
    const base = computeConfidenceScore({
      ratingCount: 3,
      verifiedCount: 2,
      disputedCount: 0,
      lastRatedAt: new Date(),
    });
    const disputed = computeConfidenceScore({
      ratingCount: 3,
      verifiedCount: 2,
      disputedCount: 3,
      lastRatedAt: new Date(),
    });
    expect(disputed).toBeLessThan(base);
  });
});
