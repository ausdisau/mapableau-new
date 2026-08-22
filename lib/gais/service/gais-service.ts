import type {
  AccessPlace,
  AccessPlaceFeature,
  AccessPlaceLocation,
} from "@prisma/client";

import type { GaisBounds } from "@/lib/gais/contracts/bounds";
import type {
  GaisAccessibilityEvent,
  GaisFeature,
  GaisPlaceSummary,
} from "@/lib/gais/contracts/feature";
import {
  barrierToGaisFeature,
  mergeEnvelopeEvidence,
  mergeObservationEvidence,
  placeFeatureToGaisFeature,
  placeToGaisFeature,
  stripPrivateFields,
} from "@/lib/gais/service/adapters";
import { barrierVerificationToGaisEvidenceState } from "@/lib/gais/service/evidence-mapper";
import { humanizeBarrierType } from "@/lib/gais/service/feature-mapper";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 200;

async function loadPlaceRelations(placeIds: string[]) {
  if (!placeIds.length) {
    return { envelopes: [], observations: [] };
  }
  const [envelopes, observations] = await Promise.all([
    prisma.accessEvidenceEnvelopeRecord.findMany({
      where: { placeId: { in: placeIds } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.accessObservationRecord.findMany({
      where: { placeId: { in: placeIds } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);
  return { envelopes, observations };
}

function placesInBoundsWhere(bounds: GaisBounds) {
  return {
    status: "published" as const,
    location: {
      latitude: { gte: bounds.minLat, lte: bounds.maxLat },
      longitude: { gte: bounds.minLng, lte: bounds.maxLng },
    },
  };
}

function buildFeaturesFromPlace(
  place: AccessPlace & {
    location: AccessPlaceLocation | null;
    features: AccessPlaceFeature[];
  },
): GaisFeature[] {
  if (!place.location) return [];

  const features: GaisFeature[] = [];
  const placeFeature = placeToGaisFeature(place);
  if (placeFeature) features.push(placeFeature);

  for (const f of place.features) {
    const gf = placeFeatureToGaisFeature(place, f);
    if (gf) features.push(gf);
  }

  return features;
}

export async function getGaisPlace(placeId: string): Promise<GaisPlaceSummary | null> {
  const place = await prisma.accessPlace.findFirst({
    where: { id: placeId, status: "published" },
    include: { location: true, features: true },
  });
  if (!place?.location) return null;

  let features = buildFeaturesFromPlace(place);
  const { envelopes, observations } = await loadPlaceRelations([placeId]);
  features = mergeObservationEvidence(
    mergeEnvelopeEvidence(features, envelopes),
    observations,
  ).map(stripPrivateFields);

  const placeFeature = features.find((f) => f.type === "PLACE");
  if (!placeFeature) return null;

  return {
    placeId: place.id,
    name: place.name,
    category: place.category,
    suburb: place.suburb,
    geometry: placeFeature.geometry,
    features,
    evidenceScope: "published_access_places",
  };
}

export async function listGaisFeaturesForPlace(placeId: string): Promise<GaisFeature[]> {
  const summary = await getGaisPlace(placeId);
  return summary?.features ?? [];
}

export async function listGaisFeaturesInBounds(
  bounds: GaisBounds,
): Promise<GaisFeature[]> {
  const limit = bounds.limit ?? DEFAULT_LIMIT;

  const places = await prisma.accessPlace.findMany({
    where: placesInBoundsWhere(bounds),
    include: { location: true, features: true },
    take: Math.min(limit, 400),
    orderBy: { updatedAt: "desc" },
  });

  let features: GaisFeature[] = [];
  for (const place of places) {
    features.push(...buildFeaturesFromPlace(place));
  }

  const placeIds = places.map((p) => p.id);
  const { envelopes, observations } = await loadPlaceRelations(placeIds);
  features = mergeObservationEvidence(
    mergeEnvelopeEvidence(features, envelopes),
    observations,
  ).map(stripPrivateFields);

  const remaining = limit - features.length;
  if (remaining > 0) {
    const barriers = await prisma.accessTemporaryBarrier.findMany({
      where: {
        latitude: { gte: bounds.minLat, lte: bounds.maxLat },
        longitude: { gte: bounds.minLng, lte: bounds.maxLng },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      take: remaining,
      orderBy: { reportedAt: "desc" },
    });

    for (const barrier of barriers) {
      const bf = barrierToGaisFeature(barrier);
      if (bf) features.push(stripPrivateFields(bf));
    }
  }

  return features.slice(0, limit);
}

export async function listActiveAccessibilityEvents(
  bounds?: GaisBounds,
): Promise<GaisAccessibilityEvent[]> {
  const now = new Date();
  const where = bounds
    ? {
        latitude: { gte: bounds.minLat, lte: bounds.maxLat },
        longitude: { gte: bounds.minLng, lte: bounds.maxLng },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      }
    : {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      };

  const barriers = await prisma.accessTemporaryBarrier.findMany({
    where,
    take: bounds?.limit ?? 100,
    orderBy: { reportedAt: "desc" },
  });

  return barriers
    .filter((b) => b.latitude != null && b.longitude != null)
    .map((b) => ({
      id: b.id,
      type: "TEMPORARY_BARRIER" as const,
      barrierType: b.type,
      label: humanizeBarrierType(b.type),
      geometry: {
        type: "Point" as const,
        coordinates: [b.longitude!, b.latitude!],
      },
      reportedAt: b.reportedAt.toISOString(),
      expiresAt: b.expiresAt?.toISOString(),
      evidenceState: barrierVerificationToGaisEvidenceState(b.verificationState),
      description: b.description ?? undefined,
      graphId: b.graphId,
    }));
}

export async function getGaisEvidenceForFeature(
  featureId: string,
): Promise<GaisFeature | null> {
  if (featureId.startsWith("gais-place-")) {
    const placeId = featureId.replace("gais-place-", "");
    const features = await listGaisFeaturesForPlace(placeId);
    return features.find((f) => f.id === featureId) ?? null;
  }

  if (featureId.startsWith("gais-barrier-")) {
    const barrierId = featureId.replace("gais-barrier-", "");
    const barrier = await prisma.accessTemporaryBarrier.findUnique({
      where: { id: barrierId },
    });
    if (!barrier) return null;
    const feature = barrierToGaisFeature(barrier);
    return feature ? stripPrivateFields(feature) : null;
  }

  const match = featureId.match(/^gais-(.+)-(.+)$/);
  if (match) {
    const [, placeId] = match;
    const features = await listGaisFeaturesForPlace(placeId);
    return features.find((f) => f.id === featureId) ?? null;
  }

  return null;
}
