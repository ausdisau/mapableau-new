import type {
  AccessEvidenceEnvelopeRecord,
  AccessObservationRecord,
  AccessPlace,
  AccessPlaceFeature,
  AccessPlaceLocation,
  AccessTemporaryBarrier,
} from "@prisma/client";

import type { GaisEvidenceRef, GaisFeature } from "@/lib/gais/contracts";
import type { GaisPoint } from "@/lib/gais/contracts/geometry";
import {
  barrierVerificationToGaisEvidenceState,
  placeConfidenceToGaisEvidenceState,
  provenanceStatusToGaisEvidenceState,
} from "@/lib/gais/service/evidence-mapper";
import {
  accessPlaceFeatureToGaisType,
  humanizeGaisFeatureType,
} from "@/lib/gais/service/feature-mapper";

type PlaceWithRelations = AccessPlace & {
  location: AccessPlaceLocation | null;
  features: AccessPlaceFeature[];
};

function pointGeometry(lat: number, lng: number): GaisPoint {
  return { type: "Point", coordinates: [lng, lat] };
}

function placeEvidenceRef(place: AccessPlace): GaisEvidenceRef {
  const state = placeConfidenceToGaisEvidenceState(
    place.confidence,
    place.sourceType,
  );
  return {
    id: `place-confidence-${place.id}`,
    sourceType: state,
    sourceLabel:
      state === "UNKNOWN"
        ? "Unknown"
        : place.sourceType.replace(/_/g, " "),
    observedAt: place.updatedAt.toISOString(),
  };
}

function featureEvidenceFromPlace(place: AccessPlace): GaisEvidenceRef[] {
  return [placeEvidenceRef(place)];
}

function envelopeToEvidenceRef(record: AccessEvidenceEnvelopeRecord): GaisEvidenceRef {
  return {
    id: record.envelopeId,
    sourceType: provenanceStatusToGaisEvidenceState(record.verificationStatus),
    sourceLabel: record.verificationStatus.replace(/_/g, " "),
    observedAt: record.observedAt?.toISOString(),
    expiresAt: record.expiresAt?.toISOString() ?? undefined,
  };
}

function observationToEvidenceRef(record: AccessObservationRecord): GaisEvidenceRef {
  return {
    id: record.id,
    sourceType: provenanceStatusToGaisEvidenceState(record.verificationStatus),
    sourceLabel: record.sourceType.replace(/_/g, " "),
    observedAt: record.observedAt?.toISOString(),
    expiresAt: record.reviewDue?.toISOString() ?? undefined,
    confidence: record.confidence ?? undefined,
  };
}

export function placeToGaisFeature(place: PlaceWithRelations): GaisFeature | null {
  if (!place.location) return null;

  const geometry = pointGeometry(place.location.latitude, place.location.longitude);

  return {
    id: `gais-place-${place.id}`,
    type: "PLACE",
    geometry,
    name: place.name,
    placeId: place.id,
    properties: {
      category: place.category,
      suburb: place.suburb ?? undefined,
    },
    evidence: featureEvidenceFromPlace(place),
    observedAt: place.updatedAt.toISOString(),
  };
}

export function placeFeatureToGaisFeature(
  place: PlaceWithRelations,
  feature: AccessPlaceFeature,
): GaisFeature | null {
  if (!place.location) return null;

  const gaisType = accessPlaceFeatureToGaisType(feature.type);
  const geometry = pointGeometry(place.location.latitude, place.location.longitude);

  const properties: GaisFeature["properties"] = {
    accessFeatureTag: feature.type,
  };

  // Feature tag indicates presence; physical measurements remain unknown unless observed.
  if (feature.type === "step_free_entry") {
    properties.stepFree = undefined;
  }
  if (feature.type === "lift_access") {
    properties.liftAvailable = undefined;
  }
  if (feature.notes) {
    properties.description = feature.notes;
  }

  return {
    id: `gais-${place.id}-${feature.type}`,
    type: gaisType,
    geometry,
    name: `${humanizeGaisFeatureType(gaisType)} — ${place.name}`,
    placeId: place.id,
    properties,
    evidence: featureEvidenceFromPlace(place),
    observedAt: place.updatedAt.toISOString(),
  };
}

export function barrierToGaisFeature(barrier: AccessTemporaryBarrier): GaisFeature | null {
  if (barrier.latitude == null || barrier.longitude == null) return null;

  const geometry = pointGeometry(barrier.latitude, barrier.longitude);
  const evidenceState = barrierVerificationToGaisEvidenceState(
    barrier.verificationState,
  );

  return {
    id: `gais-barrier-${barrier.id}`,
    type: "TEMPORARY_BARRIER",
    geometry,
    name: barrier.type.replace(/_/g, " "),
    properties: {
      barrierType: barrier.type,
      description: barrier.description ?? undefined,
      graphId: barrier.graphId,
      segmentExternalId: barrier.segmentExternalId,
    },
    evidence: [
      {
        id: barrier.id,
        sourceType: evidenceState,
        sourceLabel: "Community reported",
        observedAt: barrier.reportedAt.toISOString(),
        expiresAt: barrier.expiresAt?.toISOString(),
        confidence: barrier.confidence,
      },
    ],
    observedAt: barrier.reportedAt.toISOString(),
    validUntil: barrier.expiresAt?.toISOString(),
  };
}

export function mergeEnvelopeEvidence(
  features: GaisFeature[],
  envelopes: AccessEvidenceEnvelopeRecord[],
): GaisFeature[] {
  if (!envelopes.length) return features;

  const byPlace = new Map<string, AccessEvidenceEnvelopeRecord[]>();
  for (const env of envelopes) {
    if (!env.placeId) continue;
    const list = byPlace.get(env.placeId) ?? [];
    list.push(env);
    byPlace.set(env.placeId, list);
  }

  return features.map((feature) => {
    if (!feature.placeId) return feature;
    const extra = byPlace.get(feature.placeId);
    if (!extra?.length) return feature;

    const envelopeEvidence = extra.map(envelopeToEvidenceRef);
    return {
      ...feature,
      evidence: [...feature.evidence, ...envelopeEvidence],
    };
  });
}

export function mergeObservationEvidence(
  features: GaisFeature[],
  observations: AccessObservationRecord[],
): GaisFeature[] {
  if (!observations.length) return features;

  const byPlace = new Map<string, AccessObservationRecord[]>();
  for (const obs of observations) {
    if (!obs.placeId) continue;
    const list = byPlace.get(obs.placeId) ?? [];
    list.push(obs);
    byPlace.set(obs.placeId, list);
  }

  return features.map((feature) => {
    if (!feature.placeId) return feature;
    const extra = byPlace.get(feature.placeId);
    if (!extra?.length) return feature;

    return {
      ...feature,
      evidence: [...feature.evidence, ...extra.map(observationToEvidenceRef)],
    };
  });
}

/** Strip any participant-identifying fields from public output. */
export function stripPrivateFields(feature: GaisFeature): GaisFeature {
  const { properties, ...rest } = feature;
  const {
    reporterUserId: _r,
    userId: _u,
    participantId: _p,
    createdById: _c,
    ...safeProperties
  } = properties as Record<string, unknown>;

  return {
    ...rest,
    properties: safeProperties as GaisFeature["properties"],
  };
}
