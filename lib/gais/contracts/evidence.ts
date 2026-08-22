/**
 * GAIS evidence states — aligned with Access provenance vocabulary.
 * UNKNOWN is first-class; never collapsed into accessible/inaccessible.
 */

export const GAIS_EVIDENCE_STATES = [
  "VERIFIED",
  "AUTHORITATIVE_SOURCE",
  "PROVIDER_OR_VENUE_DECLARED",
  "COMMUNITY_REPORTED",
  "SENSOR_OBSERVED",
  "AI_INFERRED",
  "UNKNOWN",
] as const;

export type GaisEvidenceState = (typeof GAIS_EVIDENCE_STATES)[number];

export type GaisEvidenceRef = {
  id?: string;
  sourceType: GaisEvidenceState;
  sourceLabel?: string;
  observedAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  confidence?: number;
};

/** Human-readable labels for UI — never imply universal accessibility. */
export const GAIS_EVIDENCE_STATE_LABELS: Record<GaisEvidenceState, string> = {
  VERIFIED: "Independently verified",
  AUTHORITATIVE_SOURCE: "Authoritative public source",
  PROVIDER_OR_VENUE_DECLARED: "Venue supplied",
  COMMUNITY_REPORTED: "Community reported",
  SENSOR_OBSERVED: "Sensor observed",
  AI_INFERRED: "AI inferred — unverified",
  UNKNOWN: "Unknown",
};
