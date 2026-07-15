import type { AccessPlaceFeatureType } from "@prisma/client";

import type { z } from "zod";

import type { accessSearchQuerySchema } from "@/types/access-map";

export type AccessSearchFilters = z.infer<typeof accessSearchQuerySchema>;

export function buildPlaceWhere(filters: AccessSearchFilters) {
  const where: Record<string, unknown> = {
    status: "published",
  };

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.suburb) {
    where.suburb = { contains: filters.suburb, mode: "insensitive" };
  }

  if (filters.state) {
    where.stateOrRegion = { contains: filters.state, mode: "insensitive" };
  }

  if (filters.confidence) {
    where.confidence = filters.confidence;
  }

  if (filters.q?.trim()) {
    where.OR = [
      { name: { contains: filters.q.trim(), mode: "insensitive" } },
      { addressText: { contains: filters.q.trim(), mode: "insensitive" } },
      { suburb: { contains: filters.q.trim(), mode: "insensitive" } },
    ];
  }

  if (filters.features?.length) {
    where.features = {
      some: {
        type: { in: filters.features as AccessPlaceFeatureType[] },
      },
    };
  }

  if (filters.accreditationTier) {
    where.accreditationAssessments = {
      some: {
        status: "published",
        tier: filters.accreditationTier,
      },
    };
  }

  // Optional rough geo candidate box (haversine applied by callers).
  if (filters.lat != null && filters.lng != null && filters.radiusKm) {
    const latDelta = filters.radiusKm / 111;
    const lngDelta =
      filters.radiusKm /
      (111 * Math.cos((filters.lat * Math.PI) / 180) || 1);
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

  return where;
}
