import type { AccessRatingCategory, AccessRatingValue } from "@prisma/client";

import {
  COMMUNITY_CONFIDENCE_LABELS,
  REVIEW_SUMMARY_CONFIG,
  type CommunityConfidenceState,
} from "@/lib/access-reviews/review-config";
import { prisma } from "@/lib/prisma";

const SCORE_BY_VALUE: Record<string, number | null> = {
  very_difficult: 1,
  difficult: 2,
  poor: 2,
  mixed: 3,
  basic: 3,
  good: 4,
  very_good: 5,
  excellent: 5,
  unknown: null,
  not_observed: null,
  not_applicable: null,
};

export function ratingValueToNumericScore(
  value: AccessRatingValue | string
): number | null {
  return SCORE_BY_VALUE[value] ?? null;
}

function ageWeight(createdAt: Date, now: Date): number {
  const days =
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (days <= REVIEW_SUMMARY_CONFIG.recentDays) {
    return REVIEW_SUMMARY_CONFIG.weightRecent;
  }
  if (days <= REVIEW_SUMMARY_CONFIG.staleDays) {
    return REVIEW_SUMMARY_CONFIG.weightAging;
  }
  return REVIEW_SUMMARY_CONFIG.weightStale;
}

function isRecent(createdAt: Date, now: Date): boolean {
  const days =
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return days <= REVIEW_SUMMARY_CONFIG.recentDays;
}

export function bayesianAdjustedMean(
  scores: { score: number; weight: number }[],
  priorMean = REVIEW_SUMMARY_CONFIG.bayesianPriorMean,
  priorStrength = REVIEW_SUMMARY_CONFIG.bayesianPriorStrength
): number | null {
  if (scores.length === 0) return null;
  const weightSum = scores.reduce((a, s) => a + s.weight, 0);
  const weightedSum = scores.reduce((a, s) => a + s.score * s.weight, 0);
  return (
    (priorStrength * priorMean + weightedSum) / (priorStrength + weightSum)
  );
}

export function deriveConfidence(params: {
  uniqueContributors: number;
  recentContributors: number;
  evidenceCount: number;
  lastConfirmedAt: Date | null;
  now?: Date;
}): CommunityConfidenceState {
  const now = params.now ?? new Date();
  const confirmedRecently =
    params.lastConfirmedAt != null &&
    isRecent(params.lastConfirmedAt, now);

  if (params.uniqueContributors === 0) return "limited";
  if (
    confirmedRecently &&
    params.recentContributors >= 2 &&
    params.uniqueContributors >= 3
  ) {
    return "recently_verified";
  }
  if (params.uniqueContributors >= 5 || params.evidenceCount >= 3) {
    return "well_supported";
  }
  if (params.uniqueContributors >= 2) return "developing";
  return "limited";
}

export type DimensionSummaryResult = {
  category: AccessRatingCategory;
  adjustedRating: number | null;
  rawResponseCount: number;
  uniqueContributorCount: number;
  recentContributorCount: number;
  lastConfirmedAt: Date | null;
  evidenceCount: number;
  conflictCount: number;
  confidenceState: CommunityConfidenceState;
  confidenceLabel: string;
  reasonCodes: string[];
};

type RatingRow = {
  category: AccessRatingCategory;
  value: AccessRatingValue;
  review: {
    id: string;
    reviewerProfileId: string;
    status: string;
    visibility: string;
    deletedAt: Date | null;
    createdAt: Date;
    publishedAt: Date | null;
  };
};

export function computeDimensionSummariesFromRows(
  ratings: RatingRow[],
  options?: {
    evidenceByCategory?: Map<string, number>;
    confirmationsByCategory?: Map<string, Date | null>;
    conflictByCategory?: Map<string, number>;
    now?: Date;
  }
): DimensionSummaryResult[] {
  const now = options?.now ?? new Date();
  const byCategory = new Map<
    AccessRatingCategory,
    {
      scored: { score: number; weight: number; userId: string; at: Date }[];
    }
  >();

  for (const row of ratings) {
    if (row.review.status !== "published") continue;
    if (row.review.visibility !== "public") continue;
    if (row.review.deletedAt) continue;
    const score = ratingValueToNumericScore(row.value);
    if (score == null) continue;

    const at = row.review.publishedAt ?? row.review.createdAt;
    const list = byCategory.get(row.category) ?? { scored: [] };
    list.scored.push({
      score,
      weight: ageWeight(at, now),
      userId: row.review.reviewerProfileId,
      at,
    });
    byCategory.set(row.category, list);
  }

  const results: DimensionSummaryResult[] = [];

  for (const [category, data] of byCategory) {
    const unique = new Set(data.scored.map((s) => s.userId));
    const recentUsers = new Set(
      data.scored.filter((s) => isRecent(s.at, now)).map((s) => s.userId)
    );
    const evidenceCount = options?.evidenceByCategory?.get(category) ?? 0;
    const conflictCount = options?.conflictByCategory?.get(category) ?? 0;
    const lastConfirmedAt =
      options?.confirmationsByCategory?.get(category) ?? null;

    const adjusted = bayesianAdjustedMean(data.scored);
    const confidenceState = deriveConfidence({
      uniqueContributors: unique.size,
      recentContributors: recentUsers.size,
      evidenceCount,
      lastConfirmedAt,
      now,
    });

    const reasonCodes: string[] = [];
    if (data.scored.length === 0) {
      reasonCodes.push("insufficient_data");
    } else {
      reasonCodes.push(`responses:${data.scored.length}`);
      reasonCodes.push(`unique_contributors:${unique.size}`);
      reasonCodes.push(`recent_contributors:${recentUsers.size}`);
      if (evidenceCount > 0) reasonCodes.push(`evidence:${evidenceCount}`);
      if (conflictCount > 0) reasonCodes.push(`conflicts:${conflictCount}`);
      if (lastConfirmedAt) reasonCodes.push("has_confirmation");
    }

    results.push({
      category,
      adjustedRating:
        adjusted == null ? null : Math.round(adjusted * 100) / 100,
      rawResponseCount: data.scored.length,
      uniqueContributorCount: unique.size,
      recentContributorCount: recentUsers.size,
      lastConfirmedAt,
      evidenceCount,
      conflictCount,
      confidenceState,
      confidenceLabel: COMMUNITY_CONFIDENCE_LABELS[confidenceState],
      reasonCodes,
    });
  }

  return results;
}

/** Recompute legacy avg summaries and Bayesian dimension summaries. */
export async function recomputePlaceRatingSummaries(placeId: string) {
  const reviews = await prisma.accessPlaceReview.findMany({
    where: {
      placeId,
      status: "published",
      deletedAt: null,
      visibility: "public",
    },
    include: { ratings: true, evidenceLinks: true },
  });

  const ratingRows: RatingRow[] = [];
  for (const review of reviews) {
    for (const r of review.ratings) {
      ratingRows.push({
        category: r.category,
        value: r.value,
        review: {
          id: review.id,
          reviewerProfileId: review.reviewerProfileId,
          status: review.status,
          visibility: review.visibility,
          deletedAt: review.deletedAt,
          createdAt: review.createdAt,
          publishedAt: review.publishedAt,
        },
      });
    }
  }

  const evidenceByCategory = new Map<string, number>();
  for (const review of reviews) {
    const n = review.evidenceLinks?.length ?? 0;
    if (!n) continue;
    for (const r of review.ratings) {
      if (ratingValueToNumericScore(r.value) == null) continue;
      evidenceByCategory.set(
        r.category,
        (evidenceByCategory.get(r.category) ?? 0) + n
      );
    }
  }

  const confirmations = await prisma.accessReaction.findMany({
    where: {
      targetType: "review",
      reactionType: "confirm",
      clearedAt: null,
      targetId: { in: reviews.map((r) => r.id) },
    },
    orderBy: { createdAt: "desc" },
  });

  const confirmationsByCategory = new Map<string, Date | null>();
  for (const review of reviews) {
    const conf = confirmations.find((c) => c.targetId === review.id);
    if (!conf) continue;
    for (const r of review.ratings) {
      const existing = confirmationsByCategory.get(r.category);
      if (!existing || conf.createdAt > existing) {
        confirmationsByCategory.set(r.category, conf.createdAt);
      }
    }
  }

  const dimensionResults = computeDimensionSummariesFromRows(ratingRows, {
    evidenceByCategory,
    confirmationsByCategory,
  });

  const byCategory = new Map<AccessRatingCategory, number[]>();
  for (const row of ratingRows) {
    const score = ratingValueToNumericScore(row.value);
    if (score == null) continue;
    const list = byCategory.get(row.category) ?? [];
    list.push(score);
    byCategory.set(row.category, list);
  }

  const activeCategories = [...byCategory.keys()];

  if (activeCategories.length === 0) {
    await prisma.accessRatingSummary.deleteMany({ where: { placeId } });
    await prisma.accessDimensionSummary.deleteMany({ where: { placeId } });
    return [];
  }

  await prisma.accessRatingSummary.deleteMany({
    where: { placeId, category: { notIn: activeCategories } },
  });

  for (const [category, scores] of byCategory) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    await prisma.accessRatingSummary.upsert({
      where: { placeId_category: { placeId, category } },
      create: {
        placeId,
        category,
        avgScore: avg,
        sampleCount: scores.length,
      },
      update: {
        avgScore: avg,
        sampleCount: scores.length,
      },
    });
  }

  await prisma.accessDimensionSummary.deleteMany({
    where: {
      placeId,
      category: { notIn: dimensionResults.map((d) => d.category) },
    },
  });

  for (const d of dimensionResults) {
    await prisma.accessDimensionSummary.upsert({
      where: { placeId_category: { placeId, category: d.category } },
      create: {
        placeId,
        category: d.category,
        adjustedRating: d.adjustedRating,
        rawResponseCount: d.rawResponseCount,
        uniqueContributorCount: d.uniqueContributorCount,
        recentContributorCount: d.recentContributorCount,
        lastConfirmedAt: d.lastConfirmedAt,
        evidenceCount: d.evidenceCount,
        conflictCount: d.conflictCount,
        confidenceState: d.confidenceState,
        reasonCodes: d.reasonCodes,
      },
      update: {
        adjustedRating: d.adjustedRating,
        rawResponseCount: d.rawResponseCount,
        uniqueContributorCount: d.uniqueContributorCount,
        recentContributorCount: d.recentContributorCount,
        lastConfirmedAt: d.lastConfirmedAt,
        evidenceCount: d.evidenceCount,
        conflictCount: d.conflictCount,
        confidenceState: d.confidenceState,
        reasonCodes: d.reasonCodes,
      },
    });
  }

  return dimensionResults;
}

export async function getAccessibilitySummaryForPlace(placeId: string) {
  const [dimensions, alerts, accreditation, tagAgg] = await Promise.all([
    prisma.accessDimensionSummary.findMany({ where: { placeId } }),
    prisma.accessPlaceAlert.findMany({
      where: {
        placeId,
        status: "active",
        OR: [{ expectedExpiry: null }, { expectedExpiry: { gt: new Date() } }],
      },
      orderBy: { observationDate: "desc" },
    }),
    prisma.accessAccreditationAssessment.findFirst({
      where: { placeId, status: "published" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        tier: true,
        publishedAt: true,
        expiresAt: true,
        totalScore: true,
      },
    }),
    prisma.accessReviewFeatureTag.findMany({
      where: {
        review: {
          placeId,
          status: "published",
          deletedAt: null,
          visibility: "public",
        },
      },
      select: { tagKey: true, sentiment: true },
    }),
  ]);

  const positiveCounts = new Map<string, number>();
  const barrierCounts = new Map<string, number>();
  for (const t of tagAgg) {
    const map = t.sentiment === "positive" ? positiveCounts : barrierCounts;
    map.set(t.tagKey, (map.get(t.tagKey) ?? 0) + 1);
  }

  return {
    placeId,
    dimensions: dimensions.map((d) => ({
      category: d.category,
      adjustedRating: d.adjustedRating,
      rawResponseCount: d.rawResponseCount,
      uniqueContributorCount: d.uniqueContributorCount,
      recentContributorCount: d.recentContributorCount,
      lastConfirmedAt: d.lastConfirmedAt?.toISOString() ?? null,
      evidenceCount: d.evidenceCount,
      conflictCount: d.conflictCount,
      confidenceState: d.confidenceState,
      confidenceLabel:
        COMMUNITY_CONFIDENCE_LABELS[
          d.confidenceState as CommunityConfidenceState
        ] ?? COMMUNITY_CONFIDENCE_LABELS.limited,
      reasonCodes: (d.reasonCodes as string[] | null) ?? [],
    })),
    commonPositiveFeatures: [...positiveCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({ key, count })),
    commonlyReportedBarriers: [...barrierCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({ key, count })),
    alerts: alerts.map((a) => ({
      id: a.id,
      featureKey: a.featureKey,
      title: a.title,
      body: a.body,
      observationDate: a.observationDate.toISOString(),
      expectedExpiry: a.expectedExpiry?.toISOString() ?? null,
      sourceType: a.sourceType,
      status: a.status,
    })),
    professionalAccreditation: accreditation
      ? {
          tier: accreditation.tier,
          assessmentDate: accreditation.publishedAt?.toISOString() ?? null,
          expiryOrReviewDate: accreditation.expiresAt?.toISOString() ?? null,
          assessmentId: accreditation.id,
          disclaimer:
            "Professional assessment is not legal certification under the Disability Discrimination Act or building standards.",
        }
      : null,
  };
}
