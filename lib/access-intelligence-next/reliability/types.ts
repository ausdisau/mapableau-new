/**
 * Access reliability profiles — evidence-backed bands, never fabricated probabilities.
 */

import type { AccessEvidenceClass } from "../evidence/classes";
import type { TemporalAccessState } from "../temporal/vocabulary";

export type AccessReliabilityAssetKind =
  | "lift"
  | "automatic_door"
  | "platform_lift"
  | "accessible_toilet"
  | "hearing_system"
  | "caption_display"
  | "vehicle_ramp"
  | "vehicle_hoist"
  | "transport_service"
  | "provider_handoff"
  | "digital_form"
  | "public_information_feed"
  | "other";

/** Qualitative band — not a precision probability. */
export type AccessReliabilityBand =
  | "insufficient_evidence"
  | "historically_unreliable"
  | "mixed"
  | "generally_reliable"
  | "cannot_forecast";

export type AccessReliabilityObservation = {
  id: string;
  observedAt: string;
  state: TemporalAccessState;
  evidenceClass: AccessEvidenceClass;
  summary: string;
  sourceRef: string;
};

export type AccessReliabilityProfile = {
  assetId: string;
  assetKind: AccessReliabilityAssetKind;
  label: string;
  placeRef: string | null;
  graphNodeId: string | null;
  currentAvailability: TemporalAccessState;
  reliabilityBand: AccessReliabilityBand;
  recurringFailurePattern: string | null;
  fallback: string | null;
  fallbackVerified: boolean;
  lastIncidentSummary: string | null;
  lastIncidentAt: string | null;
  observations: AccessReliabilityObservation[];
  limitations: string[];
  /** Always true unless an evaluated forecast model is registered (none in this wave). */
  cannotForecastPreciseProbability: true;
  modelVersion: string | null;
  operatingMode: "synthetic" | "shadow";
};

export type AccessReliabilityScanResult = {
  placeRef: string;
  scannedAt: string;
  profiles: AccessReliabilityProfile[];
  listAlternative: Array<{
    assetId: string;
    label: string;
    band: AccessReliabilityBand;
    currentAvailability: TemporalAccessState;
    fallback: string | null;
    limitations: string[];
  }>;
  productionClaim: "none";
};
