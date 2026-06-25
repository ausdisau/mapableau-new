import { describe, expect, it } from "vitest";

import {
  computeOverallScore,
  formatDomainScoresForApi,
} from "@/lib/access-reports/access-domain-service";
import {
  ALL_ACCESS_DOMAINS,
  CATEGORY_TO_DOMAIN,
  DOMAIN_LABELS,
} from "@/lib/access-reports/access-domain-config";
import { ratingValueToScore } from "@/lib/access-reviews/access-rating-service";

describe("access domain config", () => {
  it("maps mobility categories", () => {
    expect(CATEGORY_TO_DOMAIN.accessible_parking).toBe("mobility");
    expect(CATEGORY_TO_DOMAIN.ramps_lifts).toBe("mobility");
  });

  it("maps sensory categories", () => {
    expect(CATEGORY_TO_DOMAIN.lighting_acoustics).toBe("sensory");
  });

  it("covers all five domains", () => {
    expect(ALL_ACCESS_DOMAINS).toHaveLength(5);
    expect(DOMAIN_LABELS.mobility).toContain("Mobility");
  });
});

describe("access domain scores", () => {
  it("computes overall score from domain averages", () => {
    const overall = computeOverallScore([
      { score: 4 },
      { score: 2 },
      { score: null },
    ]);
    expect(overall).toBe(3);
  });

  it("returns null when no scores", () => {
    expect(computeOverallScore([{ score: null }])).toBeNull();
  });

  it("formats API response with domain breakdown", () => {
    const formatted = formatDomainScoresForApi({
      overallScore: 4,
      confidenceScore: 0.8,
      lastUpdated: "2026-06-01T00:00:00.000Z",
      domains: ALL_ACCESS_DOMAINS.map((domain) => ({
        domain,
        score: domain === "mobility" ? 4 : null,
        confidenceScore: domain === "mobility" ? 0.8 : null,
        sampleCount: domain === "mobility" ? 3 : 0,
        lastUpdated: "2026-06-01T00:00:00.000Z",
      })),
    });
    expect(formatted.mobilityScore).toBe(4);
    expect(formatted.overallScore).toBe(4);
  });
});

describe("rating value scores", () => {
  it("maps excellent to 5", () => {
    expect(ratingValueToScore("excellent")).toBe(5);
  });

  it("returns null for unknown", () => {
    expect(ratingValueToScore("unknown")).toBeNull();
  });
});
