/**
 * Wave 0: resolve Access Intelligence place ids against canonical AccessPlace.
 * AiAccessPlace remains staging for twin graphs until full cutover.
 */

import type { AccessPlaceCategory, AccessPlaceStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { Place } from "./schemas";

const CATEGORY_MAP: Record<string, AccessPlaceCategory> = {
  civic: "government_service",
  community: "community_centre",
  community_centre: "community_centre",
  healthcare: "health_service",
  health: "health_service",
  health_service: "health_service",
  education: "education",
  retail: "shop",
  shop: "shop",
  hospitality: "cafe_restaurant",
  cafe: "cafe_restaurant",
  cafe_restaurant: "cafe_restaurant",
  transport: "transport_station",
  transport_station: "transport_station",
  library: "library",
  workplace: "other",
  recreation: "park",
  park: "park",
  other: "other",
};

export function mapCategoryToAccessPlace(category: string): AccessPlaceCategory {
  const key = category.toLowerCase().trim();
  return CATEGORY_MAP[key] ?? "other";
}

export function placeFromAccessPlace(row: {
  id: string;
  name: string;
  category: string;
  addressText: string | null;
  suburb: string | null;
  stateOrRegion: string | null;
  location: { latitude: number; longitude: number } | null;
}): Place {
  const addressParts = [row.addressText, row.suburb, row.stateOrRegion].filter(Boolean);
  return {
    id: row.id,
    name: row.name,
    address: addressParts.join(", ") || row.name,
    category: row.category,
    coordinates: row.location
      ? { lat: row.location.latitude, lng: row.location.longitude }
      : undefined,
  };
}

/**
 * Resolve a place id that may be AccessPlace.id, AiAccessPlace.id, or demo id.
 * Returns canonical AccessPlace id when bound; otherwise null.
 */
export async function resolveCanonicalAccessPlaceId(
  placeId: string,
): Promise<string | null> {
  const direct = await prisma.accessPlace.findUnique({
    where: { id: placeId },
    select: { id: true },
  });
  if (direct) return direct.id;

  const staging = await prisma.aiAccessPlace.findUnique({
    where: { id: placeId },
    select: { canonicalAccessPlaceId: true },
  });
  return staging?.canonicalAccessPlaceId ?? null;
}

/**
 * Ensure an AccessPlace exists for an AI Place and link AiAccessPlace staging row.
 * Idempotent. Does not invent access features.
 */
export async function ensureCanonicalAccessPlaceBinding(
  place: Place,
  options?: { status?: AccessPlaceStatus },
): Promise<{ accessPlaceId: string; aiPlaceId: string }> {
  const existingBinding = await prisma.aiAccessPlace.findUnique({
    where: { id: place.id },
    select: { id: true, canonicalAccessPlaceId: true },
  });

  if (existingBinding?.canonicalAccessPlaceId) {
    return {
      accessPlaceId: existingBinding.canonicalAccessPlaceId,
      aiPlaceId: existingBinding.id,
    };
  }

  const byId = await prisma.accessPlace.findUnique({
    where: { id: place.id },
    select: { id: true },
  });

  let accessPlaceId = byId?.id;

  if (!accessPlaceId) {
    const matched = await findAccessPlaceMatch(place);
    if (matched) {
      accessPlaceId = matched;
    } else {
      const created = await prisma.accessPlace.create({
        data: {
          id: place.id,
          name: place.name,
          category: mapCategoryToAccessPlace(place.category),
          addressText: place.address,
          status: options?.status ?? "published",
          sourceType: "imported",
          sourceReference: "access_intelligence_wave0",
          confidence: "unknown",
          location:
            place.coordinates != null
              ? {
                  create: {
                    latitude: place.coordinates.lat,
                    longitude: place.coordinates.lng,
                  },
                }
              : undefined,
        },
        select: { id: true },
      });
      accessPlaceId = created.id;
    }
  }

  await prisma.aiAccessPlace.upsert({
    where: { id: place.id },
    create: {
      id: place.id,
      name: place.name,
      address: place.address,
      category: place.category,
      lat: place.coordinates?.lat,
      lng: place.coordinates?.lng,
      operator: place.operator,
      openingHours: place.openingHours,
      baselineScore: place.baselineScore ?? undefined,
      accreditationTier: place.accreditationTier ?? undefined,
      lastVerifiedAt: place.lastVerifiedAt
        ? new Date(place.lastVerifiedAt)
        : undefined,
      canonicalAccessPlaceId: accessPlaceId,
    },
    update: {
      name: place.name,
      address: place.address,
      canonicalAccessPlaceId: accessPlaceId,
      updatedAt: new Date(),
    },
  });

  await prisma.aiLivingTwinMeta.upsert({
    where: { placeId: place.id },
    create: {
      placeId: place.id,
      version: "wave0",
      destinations: [],
      canonicalAccessPlaceId: accessPlaceId,
    },
    update: {
      canonicalAccessPlaceId: accessPlaceId,
    },
  });

  return { accessPlaceId, aiPlaceId: place.id };
}

async function findAccessPlaceMatch(place: Place): Promise<string | null> {
  if (place.coordinates) {
    const near = await prisma.accessPlaceLocation.findFirst({
      where: {
        latitude: {
          gte: place.coordinates.lat - 0.0005,
          lte: place.coordinates.lat + 0.0005,
        },
        longitude: {
          gte: place.coordinates.lng - 0.0005,
          lte: place.coordinates.lng + 0.0005,
        },
        place: { name: { equals: place.name, mode: "insensitive" } },
      },
      select: { placeId: true },
    });
    if (near) return near.placeId;
  }

  const byName = await prisma.accessPlace.findFirst({
    where: {
      name: { equals: place.name, mode: "insensitive" },
      OR: place.address
        ? [{ addressText: { contains: place.address.split(",")[0] ?? place.address, mode: "insensitive" } }]
        : undefined,
    },
    select: { id: true },
  });
  return byName?.id ?? null;
}

export type BackfillResult = {
  scanned: number;
  bound: number;
  createdAccessPlaces: number;
  orphans: string[];
  dryRun: boolean;
};

/**
 * Backfill AiAccessPlace → AccessPlace bindings. Idempotent.
 */
export async function backfillAiAccessPlaceBindings(options?: {
  dryRun?: boolean;
}): Promise<BackfillResult> {
  const dryRun = options?.dryRun ?? true;
  const rows = await prisma.aiAccessPlace.findMany();
  const orphans: string[] = [];
  let bound = 0;
  let createdAccessPlaces = 0;

  for (const row of rows) {
    if (row.canonicalAccessPlaceId) {
      bound += 1;
      continue;
    }

    const place: Place = {
      id: row.id,
      name: row.name,
      address: row.address,
      category: row.category,
      coordinates:
        row.lat != null && row.lng != null
          ? { lat: row.lat, lng: row.lng }
          : undefined,
      operator: row.operator ?? undefined,
      openingHours: row.openingHours ?? undefined,
      baselineScore: row.baselineScore ?? null,
      accreditationTier: row.accreditationTier ?? null,
      lastVerifiedAt: row.lastVerifiedAt?.toISOString() ?? null,
    };

    if (dryRun) {
      const match = await findAccessPlaceMatch(place);
      if (match) {
        bound += 1;
      } else {
        orphans.push(row.id);
        createdAccessPlaces += 1;
      }
      continue;
    }

    const before = await prisma.accessPlace.findUnique({
      where: { id: row.id },
      select: { id: true },
    });
    const result = await ensureCanonicalAccessPlaceBinding(place);
    bound += 1;
    if (!before && result.accessPlaceId === row.id) {
      createdAccessPlaces += 1;
    }

    await prisma.aiVisitPlan.updateMany({
      where: { placeId: row.id, accessPlaceId: null },
      data: { accessPlaceId: result.accessPlaceId },
    });
  }

  return {
    scanned: rows.length,
    bound,
    createdAccessPlaces,
    orphans,
    dryRun,
  };
}
