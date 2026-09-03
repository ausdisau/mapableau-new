import type { GaisEvidenceRef } from "@/lib/gais/contracts/evidence";
import type { GaisGeometry } from "@/lib/gais/contracts/geometry";

/**
 * GAIS Temporal Accessibility Events — public name: Access Conditions.
 * Evidence-backed only; no forecasting.
 */
export const GAIS_ACCESS_CONDITION_TYPES = [
  "OBSTRUCTION",
  "LIFT_OUTAGE",
  "PATH_CLOSURE",
  "CONSTRUCTION",
  "SURFACE_ISSUE",
  "OTHER",
] as const;

export type GaisAccessConditionType = (typeof GAIS_ACCESS_CONDITION_TYPES)[number];

export type GaisAccessConditionSource = "temporary_barrier" | "change_review";

export type GaisAccessConditionEvent = {
  id: string;
  eventType: GaisAccessConditionType;
  /** Factual public label — never "safe" / "unsafe". */
  label: string;
  geometry?: GaisGeometry;
  linkedFeatureId?: string;
  placeId?: string;
  segmentExternalId?: string;
  graphId?: string;
  description?: string;
  reportedAt: string;
  expiresAt?: string;
  evidence: GaisEvidenceRef[];
  confidence?: number;
  verificationState: string;
  source: GaisAccessConditionSource;
};

export type ListAccessConditionsInput = {
  bounds?: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
    limit?: number;
  };
  placeId?: string;
  graphId?: string;
  /** Evaluation instant — defaults to now. */
  activeAt?: Date;
  limit?: number;
};

/** @deprecated Use GaisAccessConditionEvent — kept for internal migration. */
export type GaisAccessibilityEvent = GaisAccessConditionEvent & {
  type?: "TEMPORARY_BARRIER";
  barrierType?: string;
};
