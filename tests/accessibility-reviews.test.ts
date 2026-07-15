import { describe, expect, it } from "vitest";

import {
  bayesianAdjustedMean,
  computeDimensionSummariesFromRows,
  deriveConfidence,
  ratingValueToNumericScore,
} from "@/lib/access-reviews/review-summary-service";
import { POINTS_CONFIG } from "@/lib/access-gamification/points-config";
import { BADGE_DEFINITIONS } from "@/lib/access-gamification/points-config";
import {
  canCreateReview,
  canDeleteReview,
  canModerateAccessContent,
} from "@/lib/access-reviews/review-access-policy";
import { publicReportState } from "@/lib/access-moderation/report-handling-service";
import { REVIEW_SUMMARY_CONFIG } from "@/lib/access-reviews/review-config";
import { rankAccessPlaces } from "@/lib/access-search/access-ranking-service";

describe("accessibility review scoring", () => {
  it("excludes not-observed and not-applicable from numeric scores", () => {
    expect(ratingValueToNumericScore("not_observed")).toBeNull();
    expect(ratingValueToNumericScore("not_applicable")).toBeNull();
    expect(ratingValueToNumericScore("unknown")).toBeNull();
    expect(ratingValueToNumericScore("good")).toBe(4);
    expect(ratingValueToNumericScore("very_difficult")).toBe(1);
  });

  it("applies Bayesian adjustment so one review is not definitive", () => {
    const single = bayesianAdjustedMean([{ score: 5, weight: 1 }]);
    expect(single).not.toBeNull();
    expect(single!).toBeLessThan(5);
    expect(single!).toBeGreaterThan(REVIEW_SUMMARY_CONFIG.bayesianPriorMean);
  });

  it("excludes drafts, removed, and restricted reviews from summaries", () => {
    const now = new Date("2026-07-01T00:00:00Z");
    const results = computeDimensionSummariesFromRows(
      [
        {
          category: "main_entrance",
          value: "very_good",
          review: {
            id: "1",
            reviewerProfileId: "u1",
            status: "draft",
            visibility: "public",
            deletedAt: null,
            createdAt: now,
            publishedAt: null,
          },
        },
        {
          category: "main_entrance",
          value: "very_good",
          review: {
            id: "2",
            reviewerProfileId: "u2",
            status: "published",
            visibility: "mapable_only",
            deletedAt: null,
            createdAt: now,
            publishedAt: now,
          },
        },
        {
          category: "main_entrance",
          value: "difficult",
          review: {
            id: "3",
            reviewerProfileId: "u3",
            status: "published",
            visibility: "public",
            deletedAt: new Date(),
            createdAt: now,
            publishedAt: now,
          },
        },
        {
          category: "main_entrance",
          value: "not_observed",
          review: {
            id: "4",
            reviewerProfileId: "u4",
            status: "published",
            visibility: "public",
            deletedAt: null,
            createdAt: now,
            publishedAt: now,
          },
        },
        {
          category: "main_entrance",
          value: "good",
          review: {
            id: "5",
            reviewerProfileId: "u5",
            status: "published",
            visibility: "public",
            deletedAt: null,
            createdAt: now,
            publishedAt: now,
          },
        },
      ],
      { now }
    );

    expect(results).toHaveLength(1);
    expect(results[0].rawResponseCount).toBe(1);
    expect(results[0].uniqueContributorCount).toBe(1);
  });

  it("keeps confidence independent of rating magnitude", () => {
    const lowConfidence = deriveConfidence({
      uniqueContributors: 1,
      recentContributors: 1,
      evidenceCount: 0,
      lastConfirmedAt: null,
    });
    const highConfidence = deriveConfidence({
      uniqueContributors: 6,
      recentContributors: 3,
      evidenceCount: 4,
      lastConfirmedAt: new Date(),
    });
    expect(lowConfidence).toBe("limited");
    expect(highConfidence).toBe("recently_verified");
  });

  it("treats evidence as confidence input without changing rating helper", () => {
    const withEvidence = deriveConfidence({
      uniqueContributors: 2,
      recentContributors: 1,
      evidenceCount: 3,
      lastConfirmedAt: null,
    });
    expect(withEvidence).toBe("well_supported");
    expect(ratingValueToNumericScore("good")).toBe(4);
  });

  it("labels stale windows from config rather than hardcoded copies", () => {
    expect(REVIEW_SUMMARY_CONFIG.recentDays).toBe(180);
    expect(REVIEW_SUMMARY_CONFIG.staleDays).toBe(730);
  });
});

describe("gamification safeguards", () => {
  it("defines positive complete-review points", () => {
    expect(POINTS_CONFIG.completeReview).toBe(10);
    expect(POINTS_CONFIG.helpfulReactionReceived).toBe(1);
    expect(POINTS_CONFIG.dailyReactionPointsCap).toBeGreaterThan(0);
  });

  it("has configuration-driven badge definitions without invented brand names", () => {
    expect(BADGE_DEFINITIONS.length).toBeGreaterThanOrEqual(8);
    const joined = BADGE_DEFINITIONS.map((b) => b.title).join(" ");
    expect(joined.toLowerCase()).not.toContain("accessquest");
    expect(joined.toLowerCase()).not.toContain("accessscore");
  });

  it("does not let points alter search ranking inputs", () => {
    const ranked = rankAccessPlaces(
      [
        {
          id: "a",
          name: "Cafe",
          category: "cafe",
          suburb: null,
          updatedAt: new Date(),
          confidence: "user_reported",
          location: { latitude: -33.8, longitude: 151.2 },
          ratingSummaries: [{ avgScore: 4, sampleCount: 2 }],
          accreditationAssessments: [],
          _count: { reviews: 2 },
        },
      ],
      { q: "Cafe" }
    );
    expect(ranked[0]?.id).toBe("a");
    // Ranking must not accept a points field — points are intentionally absent.
    expect("points" in (ranked[0] as object)).toBe(false);
  });
});

describe("authorization policy", () => {
  it("blocks anonymous publishing", () => {
    expect(canCreateReview(null)).toBe(false);
  });

  it("allows authors and admins to edit, not arbitrary users", () => {
    const user = {
      id: "u1",
      primaryRole: "participant" as const,
      email: "a@b.c",
      name: "A",
      phone: null,
      timezone: "Australia/Sydney",
      locale: "en-AU",
      roles: ["participant" as const],
    };
    expect(canDeleteReview(user, "u1")).toBe(true);
    expect(canDeleteReview(user, "other")).toBe(false);
    expect(
      canModerateAccessContent({
        ...user,
        primaryRole: "mapable_admin",
        roles: ["mapable_admin"],
      })
    ).toBe(true);
  });
});

describe("moderation privacy", () => {
  it("maps protected reports to under review publicly", () => {
    expect(publicReportState("escalated")).toBe("Under review");
    expect(publicReportState("pending")).toBe("Under review");
  });
});
