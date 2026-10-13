import type { NormalizedObservation } from "@/lib/integrations/access/contracts";

import { attributionLabelForProvider } from "./attribution";
import {
  publicAccessFeatureSchema,
  type PublicAccessFeature,
  type PublicFeatureList,
} from "./types";

const IDENTITY_KEYS = [
  "actorRef",
  "reporterId",
  "userId",
  "participantId",
  "contributorId",
  "email",
  "name",
] as const;

/** Strip identity fields from arbitrary payloads before public emission. */
export function stripIdentityFields<T extends Record<string, unknown>>(
  record: T,
): Omit<T, keyof typeof IDENTITY_KEYS> {
  const out = { ...record };
  for (const key of IDENTITY_KEYS) {
    delete (out as Record<string, unknown>)[key];
  }
  return out;
}

export function projectObservationToPublicFeature(
  observation: NormalizedObservation,
  featureId: string,
): PublicAccessFeature {
  const publicPayload = stripIdentityFields({
    featureId,
    featureType: observation.featureType,
    attribute: observation.attribute,
    value: observation.value,
    valueQualifier: observation.valueQualifier,
    geometry: observation.geometry,
    placeId: observation.placeId,
    observedAt: observation.observedAt,
    verificationState: observation.provenance.verificationState,
    attributionLabel: attributionLabelForProvider(
      observation.provenance.sourceProvider,
    ),
    licence: observation.provenance.licence,
    sourceProvider: observation.provenance.sourceProvider,
  });
  return publicAccessFeatureSchema.parse(publicPayload);
}

export function buildPublicFeatureListResponse(input: {
  features: PublicAccessFeature[];
  page: number;
  pageSize: number;
  total: number;
  bbox?: [number, number, number, number];
}): PublicFeatureList {
  return {
    features: input.features,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total: input.total,
      hasMore: input.page * input.pageSize < input.total,
    },
    bbox: input.bbox,
  };
}
