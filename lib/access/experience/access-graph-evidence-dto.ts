export type AccessGraphEvidenceSourceClass =
  | "community_reported"
  | "organisation_supplied"
  | "assessor_measured"
  | "sensor_observed"
  | "ai_inferred"
  | "independently_verified"
  | "unknown"
  | "expired";

export type AccessGraphEvidenceVerificationStatus =
  | "verified"
  | "observed"
  | "venue_reported"
  | "community_reported"
  | "unknown"
  | "outdated"
  | "disputed";

export type AccessGraphEvidenceFreshnessState =
  | "fresh"
  | "stale"
  | "expired"
  | "unknown_age";

export type AccessGraphEvidenceItem = {
  id: string;
  featureKey: string;
  ontologyConceptId: string;
  value: string | number | boolean;
  unit: string | null;
  observedAt: string;
  confidence: number | null;
  disputed: boolean;
  provenance: {
    sourceClass: AccessGraphEvidenceSourceClass;
    verificationStatus: AccessGraphEvidenceVerificationStatus;
    displayLabel: string;
    unverified: boolean;
    aiInferred: boolean;
  };
  freshness: {
    state: AccessGraphEvidenceFreshnessState;
    policyDescription: string;
    expiresAt: string;
  };
};

export type AccessGraphEvidenceDto = {
  placeId: string;
  featureCount: number;
  observationCount: number;
  expiredCount: number;
  unverifiedCount: number;
  observations: AccessGraphEvidenceItem[];
  note: string;
  claimState: "in_development";
  productionClaim: "none";
};
