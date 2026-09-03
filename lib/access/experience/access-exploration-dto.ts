/**
 * Client-safe exploration place projection for Access Experience V2.
 * Canonical path: AccessPlace (+ optional GAIS summary) → this DTO.
 * Never expose full Prisma rows or participant PII.
 */

import type { PlaceAccessProfile } from "@/lib/access/fit/types";
import type { GaisEvidenceState } from "@/lib/gais/contracts/evidence";

export type AccessExplorationEvidenceRef = {
  sourceType: GaisEvidenceState;
  sourceLabel?: string;
  observedAt?: string;
  verifiedAt?: string;
  confidence?: number;
};

export type AccessExplorationCapability = {
  key: string;
  label: string;
  /** null = UNKNOWN — never coerce missing evidence to false/true. */
  value: boolean | number | string | null;
  unit?: string;
  evidenceRefs: AccessExplorationEvidenceRef[];
};

export type AccessExplorationPlace = {
  placeId: string;
  name: string;
  category: string;
  addressText?: string | null;
  suburb?: string | null;
  stateOrRegion?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** True when both lat/lng are finite numbers. */
  hasCoordinates: boolean;
  reviewCount?: number;
  confidence: PlaceAccessProfile["confidence"];
  lastVerified?: string | null;
  /** AccessFit-ready profile projected from AccessPlace / GAIS facts. */
  accessProfile: PlaceAccessProfile;
  capabilities: AccessExplorationCapability[];
  provenanceSummary?: string;
  freshnessLabel?: string;
  disputed: boolean;
  unknownCapabilityCount: number;
  accreditationSummary?: {
    tier: string;
    disclaimer: string;
  } | null;
  sourceType?: string;
};

export type AccessPlaceFeatureLike = {
  type: string;
  notes?: string | null;
};

export type AccessPlaceLike = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  addressText?: string | null;
  suburb?: string | null;
  stateOrRegion?: string | null;
  confidence?: string | null;
  sourceType?: string | null;
  updatedAt?: Date | string | null;
  location?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  features?: AccessPlaceFeatureLike[];
  _count?: { reviews?: number };
};

export type GaisPlaceSummaryLike = {
  evidenceStates?: GaisEvidenceState[];
  disputed?: boolean;
  provenanceLabel?: string;
  freshnessLabel?: string;
  capabilities?: AccessExplorationCapability[];
};
