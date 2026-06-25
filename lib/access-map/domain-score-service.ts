import type { AccessDomain, AccessRatingCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const DOMAIN_CATEGORIES: Record<AccessDomain, AccessRatingCategory[]> = {
  mobility: [
    "accessible_parking",
    "public_transport_dropoff",
    "path_to_entrance",
    "main_entrance",
    "doorway",
    "internal_movement",
    "ramps_lifts",
    "accessible_toilet",
    "ambulant_toilet",
  ],
  sensory: ["lighting_acoustics", "seating_furniture"],
  communication: ["signage", "hearing_access", "online_information"],
  cognitive: ["signage", "lighting_acoustics"],
  service: ["service_counter", "staff_training", "service_access"],
};

export function domainForCategory(category: AccessRatingCategory): AccessDomain[] {
  const domains: AccessDomain[] = [];
  for (const [domain, categories] of Object.entries(DOMAIN_CATEGORIES) as [
    AccessDomain,
    AccessRatingCategory[],
  ][]) {
    if (categories.includes(category)) domains.push(domain);
  }
  return domains;
}

export async function getPlaceDomainSummaries(placeId: string) {
  return prisma.accessPlaceDomainSummary.findMany({
    where: { placeId },
    orderBy: { domain: "asc" },
  });
}

export async function recomputePlaceDomainSummaries(placeId: string) {
  const summaries = await prisma.accessRatingSummary.findMany({
    where: { placeId },
  });

  const byDomain = new Map<AccessDomain, number[]>();

  for (const summary of summaries) {
    if (summary.avgScore == null || summary.sampleCount === 0) continue;
    const normalized = (summary.avgScore / 5) * 100;
    for (const domain of domainForCategory(summary.category)) {
      const list = byDomain.get(domain) ?? [];
      list.push(normalized);
      byDomain.set(domain, list);
    }
  }

  const domains = Object.keys(DOMAIN_CATEGORIES) as AccessDomain[];

  for (const domain of domains) {
    const scores = byDomain.get(domain) ?? [];
    if (scores.length === 0) {
      await prisma.accessPlaceDomainSummary.deleteMany({
        where: { placeId, domain },
      });
      continue;
    }
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    await prisma.accessPlaceDomainSummary.upsert({
      where: { placeId_domain: { placeId, domain } },
      create: {
        placeId,
        domain,
        score: Math.round(avg * 10) / 10,
        sampleCount: scores.length,
      },
      update: {
        score: Math.round(avg * 10) / 10,
        sampleCount: scores.length,
      },
    });
  }
}

export async function getPlaceAccessSummary(placeId: string) {
  const [domains, place] = await Promise.all([
    getPlaceDomainSummaries(placeId),
    prisma.accessPlace.findUnique({
      where: { id: placeId },
      select: { confidence: true, updatedAt: true },
    }),
  ]);

  const scoreMap = new Map(domains.map((d) => [d.domain, d.score]));
  const overallScores = domains
    .map((d) => d.score)
    .filter((s): s is number => s != null);

  const overallScore =
    overallScores.length > 0
      ? Math.round(
          (overallScores.reduce((a, b) => a + b, 0) / overallScores.length) * 10
        ) / 10
      : null;

  const confidenceMap: Record<string, number> = {
    unknown: 0,
    user_reported: 25,
    multiple_user_reports: 50,
    venue_claimed: 65,
    mapable_verified: 80,
    mapable_accredited: 95,
  };

  return {
    overallScore,
    mobilityScore: scoreMap.get("mobility") ?? null,
    sensoryScore: scoreMap.get("sensory") ?? null,
    communicationScore: scoreMap.get("communication") ?? null,
    cognitiveScore: scoreMap.get("cognitive") ?? null,
    serviceScore: scoreMap.get("service") ?? null,
    confidenceScore: place
      ? (confidenceMap[place.confidence] ?? 0)
      : null,
    lastUpdated: place?.updatedAt.toISOString() ?? null,
  };
}
