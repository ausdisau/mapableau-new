import type { GaisEvidenceRef } from "./evidence";
import type { GaisFeatureType } from "./feature-types";
import type { GaisGeometry } from "./geometry";
import type { GaisFeatureProperties } from "./properties";

export type { GaisAccessConditionEvent as GaisAccessibilityEvent } from "@/lib/gais/conditions/types";

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
