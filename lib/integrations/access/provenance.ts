/**
 * Bridge external provenance → MapAble Access Graph intake vocabulary.
 * Never upgrades unverified external labels to verified capabilities.
 */

import type { AccessObservationSourceType } from "@/lib/access/infrastructure/provenance";

import type {
  ContributorType,
  EvidenceProvenance,
  VerificationState,
} from "./contracts";

export type MapAbleObservationIntake = {
  sourceType: AccessObservationSourceType;
  evidenceKinds: string[];
  verificationHint:
    | "community_reported"
    | "observed"
    | "unknown"
    | "disputed"
    | "outdated";
  confidence: number | null;
  externalProvenance: EvidenceProvenance;
};

export function contributorTypeToSourceType(
  contributorType: ContributorType,
): AccessObservationSourceType {
  switch (contributorType) {
    case "COMMUNITY":
      return "community";
    case "OPERATOR":
    case "GOVERNMENT":
      return "operator";
    case "PROFESSIONAL":
      return "trained_assessor";
    case "SENSOR":
      return "sensor";
    case "AI":
      return "ai";
    case "ROBOTIC_SURVEY":
      return "sensor";
    case "OTHER":
      return "system";
    default: {
      const _exhaustive: never = contributorType;
      return _exhaustive;
    }
  }
}

export function verificationStateToHint(
  state: VerificationState,
): MapAbleObservationIntake["verificationHint"] {
  switch (state) {
    case "UNVERIFIED":
    case "COMMUNITY_REPORTED":
      return "community_reported";
    case "CORROBORATED":
    case "OPERATOR_CONFIRMED":
    case "PROFESSIONALLY_VERIFIED":
      return "observed";
    case "DISPUTED":
      return "disputed";
    case "STALE":
      return "outdated";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function toMapAbleObservationIntake(
  provenance: EvidenceProvenance,
): MapAbleObservationIntake {
  const sourceType = contributorTypeToSourceType(provenance.contributorType);
  const evidenceKinds = [
    "external_provider",
    `provider:${provenance.sourceProvider}`,
    ...provenance.evidenceRefs.map((ref) => `evidence:${ref.kind}`),
  ];
  if (sourceType === "ai") evidenceKinds.push("ai_inferred");
  return {
    sourceType,
    evidenceKinds,
    verificationHint: verificationStateToHint(provenance.verificationState),
    confidence: provenance.confidence ?? null,
    externalProvenance: provenance,
  };
}

export function assertNotSilentTruth(input: {
  claimStrength: string;
  verificationState: VerificationState;
}): void {
  if (
    input.claimStrength === "capability_candidate" &&
    (input.verificationState === "UNVERIFIED" ||
      input.verificationState === "COMMUNITY_REPORTED")
  ) {
    throw new Error(
      "Unverified observations cannot be promoted to capability_candidate",
    );
  }
}
