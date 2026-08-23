import type { GaisEvidenceRef } from "@/lib/gais/contracts/evidence";
import type { GaisGeometry } from "@/lib/gais/contracts/geometry";

/**
 * Arrival / destination sub-feature kinds.
 * Generic enough for future geographic sub-features — no speculative 3D.
 */
export const GAIS_ARRIVAL_FEATURE_KINDS = [
  "ENTRANCE",
  "DROP_OFF",
  "LIFT",
  "TOILET",
  "REST_POINT",
  "MAIN_ENTRANCE",
] as const;

export type GaisArrivalFeatureKind = (typeof GAIS_ARRIVAL_FEATURE_KINDS)[number];

export type GaisArrivalFeature = {
  id: string;
  kind: GaisArrivalFeatureKind;
  label: string;
  /** Present only when recorded — never fabricated. */
  geometry: GaisGeometry | null;
  description?: string;
  accessFeatureTag?: string;
  evidence: GaisEvidenceRef[];
  /** Explicit unknown attributes for this arrival feature. */
  unknowns: string[];
};

export type GaisDestinationPlace = {
  placeId: string;
  name: string;
  category: string;
  addressText?: string | null;
  suburb?: string | null;
  stateOrRegion?: string | null;
  confidence: string;
  sourceType: string;
};

export type GaisDestinationResolution = {
  place: GaisDestinationPlace;
  /** Place centre from AccessPlaceLocation — not an entrance. */
  centrePoint: GaisGeometry | null;
  knownEntrances: GaisArrivalFeature[];
  knownDropOffPoints: GaisArrivalFeature[];
  otherArrivalFeatures: GaisArrivalFeature[];
  evidence: GaisEvidenceRef[];
  unknowns: string[];
  meta: {
    claimState: "in_development";
    indoorNavigation: false;
    fabricatedCoordinates: false;
    note: string;
  };
};
