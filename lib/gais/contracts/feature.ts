import type { GaisEvidenceRef } from "./evidence";
import type { GaisFeatureType } from "./feature-types";
import type { GaisGeometry } from "./geometry";
import type { GaisFeatureProperties } from "./properties";

export type GaisFeature = {
  id: string;
  type: GaisFeatureType;
  geometry: GaisGeometry;
  name?: string;
  placeId?: string;
  properties: GaisFeatureProperties;
  evidence: GaisEvidenceRef[];
  observedAt?: string;
  validUntil?: string;
};

export type GaisPlaceSummary = {
  placeId: string;
  name: string;
  category: string;
  suburb?: string | null;
  geometry: GaisGeometry;
  features: GaisFeature[];
  evidenceScope: string;
};

export type GaisAccessibilityEvent = {
  id: string;
  type: "TEMPORARY_BARRIER";
  barrierType: string;
  label: string;
  geometry: GaisGeometry;
  reportedAt: string;
  expiresAt?: string;
  evidenceState: GaisEvidenceRef["sourceType"];
  description?: string;
  graphId: string;
};
