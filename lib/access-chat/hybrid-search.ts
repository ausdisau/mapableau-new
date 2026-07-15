import type { AccessPlaceCategory, AccessPlaceFeatureType } from "@prisma/client";

import {
  rankPlacesByAccessFit,
  type RankablePlace,
} from "@/lib/access-chat/access-fit-ranker";
import { requiredFeaturesToPrismaTypes } from "@/lib/access-chat/feature-map";
import { rewriteQueryForSearch } from "@/lib/access-chat/query-rewrite";
import { getAccessEvidenceVectorStore } from "@/lib/access-chat/vector-store";
import { buildPlaceWhere } from "@/lib/access-map/access-filter-service";
import { distanceKm } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import type {
  AccessSearchIntent,
  AccessSearchResult,
} from "@/types/access-chat";
import type { AccessSearchFilters } from "@/lib/access-map/access-filter-service";

const CANDIDATE_LIMIT = 80;

export type HybridSearchOutcome = {
  results: AccessSearchResult[];
  candidateCount: number;
  keywords: string;
  vectorUsed: boolean;
};

export async function runHybridAccessSearch(
  intent: AccessSearchIntent,
  options?: { limit?: number },
): Promise<HybridSearchOutcome> {
  const { keywords } = await rewriteQueryForSearch(intent);
  const featureTypes = requiredFeaturesToPrismaTypes(intent.requiredFeatures);
  const category = intent.categories?.[0] as AccessPlaceCategory | undefined;

  const filters: AccessSearchFilters = {
    q: keywords || undefined,
    category,
    suburb: intent.location?.suburb,
    lat: intent.location?.lat,
    lng: intent.location?.lng,
    radiusKm:
      intent.location?.radiusMeters != null
        ? intent.location.radiusMeters / 1000
        : undefined,
    features: featureTypes.length ? featureTypes : undefined,
    sort: "relevance",
    limit: CANDIDATE_LIMIT,
  };

  const where = buildPlaceWhere(filters);
  applyBoundingBox(where, filters);

  const places = await prisma.accessPlace.findMany({
    where,
    take: CANDIDATE_LIMIT,
    include: {
      location: true,
      features: true,
      ratingSummaries: true,
      accreditationAssessments: {
        where: { status: "published" },
        take: 1,
        orderBy: { publishedAt: "desc" },
      },
      reviews: {
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { photos: { take: 1, select: { id: true } } },
      },
      alerts: {
        where: {
          status: "active",
          OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
        },
        take: 5,
        orderBy: { startsAt: "desc" },
      },
      _count: {
        select: { reviews: { where: { status: "published" } } },
      },
    },
  });

  let candidates = places as unknown as RankablePlace[];

  // Soften feature filter: if too few matches with all features required via OR-style,
  // already used "some" with any of mapped types. If zero results, relax features.
  if (candidates.length === 0 && featureTypes.length) {
    const relaxed = { ...filters, features: undefined };
    const relaxedWhere = buildPlaceWhere(relaxed);
    applyBoundingBox(relaxedWhere, relaxed);
    const fallbackPlaces = await prisma.accessPlace.findMany({
      where: relaxedWhere,
      take: CANDIDATE_LIMIT,
      include: {
        location: true,
        features: true,
        ratingSummaries: true,
        accreditationAssessments: {
          where: { status: "published" },
          take: 1,
          orderBy: { publishedAt: "desc" },
        },
        reviews: {
          where: { status: "published" },
          orderBy: { createdAt: "desc" },
          take: 3,
          include: { photos: { take: 1, select: { id: true } } },
        },
        alerts: {
          where: {
            status: "active",
            OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
          },
          take: 5,
          orderBy: { startsAt: "desc" },
        },
        _count: {
          select: { reviews: { where: { status: "published" } } },
        },
      },
    });
    candidates = fallbackPlaces as unknown as RankablePlace[];
  }

  if (filters.lat != null && filters.lng != null && filters.radiusKm) {
    candidates = candidates.filter((p) => {
      if (!p.location) return false;
      return (
        distanceKm(
          filters.lat!,
          filters.lng!,
          p.location.latitude,
          p.location.longitude,
        ) <= filters.radiusKm!
      );
    });
  }

  // Keyword boost from review bodies (structured complementary to name search)
  if (keywords) {
    const kw = keywords.toLowerCase();
    candidates = [...candidates].sort((a, b) => {
      const aHit = reviewKeywordHit(a, kw) ? 1 : 0;
      const bHit = reviewKeywordHit(b, kw) ? 1 : 0;
      return bHit - aHit;
    });
  }

  const vectorStore = getAccessEvidenceVectorStore();
  const vectorUsed = vectorStore.isEnabled();
  if (vectorUsed) {
    // Reserved for embeddings; no-op store returns [].
    await vectorStore.search([], {
      placeIds: candidates.map((c) => c.id),
      limit: 20,
    });
  }

  const results = rankPlacesByAccessFit(candidates, intent, {
    limit: options?.limit ?? 5,
  });

  return {
    results,
    candidateCount: candidates.length,
    keywords,
    vectorUsed,
  };
}

function reviewKeywordHit(place: RankablePlace, kw: string): boolean {
  return place.reviews.some((r) => r.reviewBody.toLowerCase().includes(kw));
}

/** Rough degree bounding box to reduce candidates before haversine. */
export function applyBoundingBox(
  where: Record<string, unknown>,
  filters: AccessSearchFilters,
): void {
  if (filters.lat == null || filters.lng == null || !filters.radiusKm) return;

  const latDelta = filters.radiusKm / 111;
  const lngDelta =
    filters.radiusKm / (111 * Math.cos((filters.lat * Math.PI) / 180) || 1);

  where.location = {
    is: {
      latitude: {
        gte: filters.lat - latDelta,
        lte: filters.lat + latDelta,
      },
      longitude: {
        gte: filters.lng - lngDelta,
        lte: filters.lng + lngDelta,
      },
    },
  };
}

export function intentToFeatureList(
  intent: AccessSearchIntent,
): AccessPlaceFeatureType[] {
  return requiredFeaturesToPrismaTypes(intent.requiredFeatures);
}
