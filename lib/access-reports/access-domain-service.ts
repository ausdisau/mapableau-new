import type { AccessDomain, AccessRatingCategory } from "@prisma/client";

import { ratingValueToScore } from "@/lib/access-reviews/access-rating-service";
import { prisma } from "@/lib/prisma";

import {
  ALL_ACCESS_DOMAINS,
  CATEGORY_TO_DOMAIN,
} from "./access-domain-config";

export type DomainSummaryView = {
  domain: AccessDomain;
  score: number | null;
  confidenceScore: number | null;
  sampleCount: number;
  lastUpdated: string;
};

export type PlaceScoresView = {
  overallScore: number | null;
  confidenceScore: number | null;
  domains: DomainSummaryView[];
  lastUpdated: string | null;
};

export function computeOverallScore(
  domains: { score: number | null }[]
): number | null {
  const scores = domains
    .map((d) => d.score)
    .filter((s): s is number => s != null);
  if (!scores.length) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export async function recomputePlaceDomainSummaries(placeId: string) {
  const reviews = await prisma.accessPlaceReview.findMany({
    where: { placeId, status: "published" },
    include: { ratings: true },
  });

  const byDomain = new Map<AccessDomain, number[]>();

  for (const review of reviews) {
    for (const rating of review.ratings) {
      const score = ratingValueToScore(rating.value);
      if (score == null) continue;
      const domain = CATEGORY_TO_DOMAIN[rating.category as AccessRatingCategory];
      if (!domain) continue;
      const list = byDomain.get(domain) ?? [];
      list.push(score);
      byDomain.set(domain, list);
    }
  }

  for (const domain of ALL_ACCESS_DOMAINS) {
    const scores = byDomain.get(domain);
    if (!scores?.length) {
      await prisma.accessPlaceDomainSummary.deleteMany({
        where: { placeId, domain },
      });
      continue;
    }

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const confidence = Math.min(1, scores.length / 5);

    await prisma.accessPlaceDomainSummary.upsert({
      where: { placeId_domain: { placeId, domain } },
      create: {
        placeId,
        domain,
        score: avg,
        confidenceScore: confidence,
        sampleCount: scores.length,
      },
      update: {
        score: avg,
        confidenceScore: confidence,
        sampleCount: scores.length,
      },
    });
  }
}

export async function getPlaceDomainSummaries(
  placeId: string
): Promise<PlaceScoresView> {
  const summaries = await prisma.accessPlaceDomainSummary.findMany({
    where: { placeId },
    orderBy: { domain: "asc" },
  });

  const domainMap = new Map(summaries.map((s) => [s.domain, s]));

  const domains: DomainSummaryView[] = ALL_ACCESS_DOMAINS.map((domain) => {
    const s = domainMap.get(domain);
    return {
      domain,
      score: s?.score ?? null,
      confidenceScore: s?.confidenceScore ?? null,
      sampleCount: s?.sampleCount ?? 0,
      lastUpdated: s?.lastUpdated.toISOString() ?? new Date(0).toISOString(),
    };
  });

  const lastUpdated =
    summaries.length > 0
      ? summaries
          .reduce(
            (latest, s) => (s.lastUpdated > latest ? s.lastUpdated : latest),
            summaries[0]!.lastUpdated
          )
          .toISOString()
      : null;

  const confidenceValues = domains
    .map((d) => d.confidenceScore)
    .filter((c): c is number => c != null);
  const confidenceScore =
    confidenceValues.length > 0
      ? Math.round(
          (confidenceValues.reduce((a, b) => a + b, 0) /
            confidenceValues.length) *
            100
        ) / 100
      : null;

  return {
    overallScore: computeOverallScore(domains),
    confidenceScore,
    domains,
    lastUpdated,
  };
}

export function formatDomainScoresForApi(scores: PlaceScoresView) {
  return {
    overallScore: scores.overallScore,
    confidenceScore: scores.confidenceScore,
    lastUpdated: scores.lastUpdated,
    mobilityScore:
      scores.domains.find((d) => d.domain === "mobility")?.score ?? null,
    sensoryScore:
      scores.domains.find((d) => d.domain === "sensory")?.score ?? null,
    communicationScore:
      scores.domains.find((d) => d.domain === "communication")?.score ?? null,
    cognitiveScore:
      scores.domains.find((d) => d.domain === "cognitive")?.score ?? null,
    serviceScore:
      scores.domains.find((d) => d.domain === "service")?.score ?? null,
    domains: scores.domains,
  };
}
