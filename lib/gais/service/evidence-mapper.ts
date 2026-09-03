import type { AccessConfidenceLevel, AccessProvenanceStatus } from "@prisma/client";
import {
  gaisStateToEvidenceProvenance,
  sourceClassToEvidenceProvenance,
  storageStatusToEvidenceProvenance,
  type EvidenceProvenance,
} from "@mapable/contracts";

import type { AccessSourceClass } from "@/lib/access/infrastructure/provenance";
import type { GaisEvidenceState } from "@/lib/gais/contracts/evidence";

export function provenanceStatusToGaisEvidenceState(
  status: AccessProvenanceStatus | string | null | undefined,
): GaisEvidenceState {
  switch (status) {
    case "verified":
      return "VERIFIED";
    case "observed":
      return "SENSOR_OBSERVED";
    case "venue_reported":
      return "PROVIDER_OR_VENUE_DECLARED";
    case "community_reported":
      return "COMMUNITY_REPORTED";
    case "disputed":
    case "outdated":
      return "UNKNOWN";
    case "unknown":
    default:
      return "UNKNOWN";
  }
}

export function sourceClassToGaisEvidenceState(
  sourceClass: AccessSourceClass | string | null | undefined,
): GaisEvidenceState {
  switch (sourceClass) {
    case "independently_verified":
    case "assessor_measured":
      return "VERIFIED";
    case "organisation_supplied":
      return "PROVIDER_OR_VENUE_DECLARED";
    case "community_reported":
      return "COMMUNITY_REPORTED";
    case "sensor_observed":
      return "SENSOR_OBSERVED";
    case "ai_inferred":
      return "AI_INFERRED";
    case "expired":
    case "unknown":
    default:
      return "UNKNOWN";
  }
}

export function placeConfidenceToGaisEvidenceState(
  confidence: AccessConfidenceLevel,
  sourceType?: string,
): GaisEvidenceState {
  switch (confidence) {
    case "mapable_accredited":
    case "mapable_verified":
      return "VERIFIED";
    case "venue_claimed":
      return "PROVIDER_OR_VENUE_DECLARED";
    case "multiple_user_reports":
    case "user_reported":
      return "COMMUNITY_REPORTED";
    case "unknown":
    default:
      if (sourceType === "government" || sourceType === "import") {
        return "AUTHORITATIVE_SOURCE";
      }
      return "UNKNOWN";
  }
}

export function barrierVerificationToGaisEvidenceState(
  verificationState: string,
): GaisEvidenceState {
  if (verificationState === "verified") return "VERIFIED";
  if (verificationState === "community_reported") return "COMMUNITY_REPORTED";
  return "UNKNOWN";
}

export function gaisEvidenceStateLabel(state: GaisEvidenceState): string {
  const labels: Record<GaisEvidenceState, string> = {
    VERIFIED: "Independently verified",
    AUTHORITATIVE_SOURCE: "Authoritative public source",
    PROVIDER_OR_VENUE_DECLARED: "Venue supplied",
    COMMUNITY_REPORTED: "Community reported",
    SENSOR_OBSERVED: "Sensor observed",
    AI_INFERRED: "AI inferred — unverified",
    UNKNOWN: "Unknown",
  };
  return labels[state];
}

/** Map any layer to canonical EvidenceProvenance for API responses. */
export function toCanonicalEvidenceProvenance(input: {
  storageStatus?: AccessProvenanceStatus | string | null;
  sourceClass?: AccessSourceClass | string | null;
  gaisState?: GaisEvidenceState | string | null;
  freshnessExpired?: boolean;
}): EvidenceProvenance {
  if (input.gaisState) {
    return gaisStateToEvidenceProvenance(input.gaisState);
  }
  if (input.sourceClass) {
    return sourceClassToEvidenceProvenance(input.sourceClass, {
      freshnessExpired: input.freshnessExpired,
    });
  }
  return storageStatusToEvidenceProvenance(input.storageStatus, {
    freshnessExpired: input.freshnessExpired,
  });
}
