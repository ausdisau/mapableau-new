import type {
  MapAbleContextRecord,
  ProvenanceDisplay,
  SourceTrustClass,
  VerificationStatus,
} from "./types";
import { assertInferenceCannotMasquerade } from "./freshness";

const SOURCE_LABELS: Record<SourceTrustClass, string> = {
  participant_declared: "You reported this",
  verified_system_record: "Verified system record",
  authenticated_provider_record: "Authenticated provider record",
  human_operator_record: "Human operator record",
  public_authoritative_source: "Public authoritative source",
  community_observation: "Community observation",
  model_inference: "Model suggestion (not verified evidence)",
};

/**
 * Strip sensitive payload for revoked consent while preserving audit refs.
 * Never silently leave sensitive content available to model calls.
 */
export function redactPayloadForRevocation(
  record: MapAbleContextRecord,
): MapAbleContextRecord {
  return {
    ...record,
    consentRevokedAt: record.consentRevokedAt ?? new Date().toISOString(),
    payload: {
      _redacted: true,
      reason: "consent_revoked",
      retainedEvidenceRefs: record.evidenceRefs,
    },
    dataClasses: record.dataClasses.includes("operational")
      ? record.dataClasses
      : [...record.dataClasses, "operational"],
  };
}

export function preserveProvenanceFields(
  record: MapAbleContextRecord,
): Pick<
  MapAbleContextRecord,
  | "sourceType"
  | "sourceRef"
  | "sourceAuthority"
  | "observedAt"
  | "receivedAt"
  | "verificationStatus"
  | "evidenceRefs"
  | "traceId"
> {
  return {
    sourceType: record.sourceType,
    sourceRef: record.sourceRef,
    sourceAuthority: record.sourceAuthority,
    observedAt: record.observedAt,
    receivedAt: record.receivedAt,
    verificationStatus: record.verificationStatus,
    evidenceRefs: [...record.evidenceRefs],
    traceId: record.traceId,
  };
}

export function buildProvenanceDisplay(
  record: MapAbleContextRecord,
): ProvenanceDisplay {
  const sourceLabel = SOURCE_LABELS[record.sourceType];
  const whyUsed =
    record.sourceType === "model_inference"
      ? "Used only as a suggestion; not treated as verified evidence."
      : `Used because it is relevant ${record.contextType.replace(/_/g, " ")} for this mission.`;

  const correctionRoute =
    record.sourceType === "participant_declared"
      ? "/my-mapable/preferences"
      : "/my-mapable/corrections";

  const dateLabel = formatAccessibleDate(record.observedAt);
  const accessibleSummary = [
    sourceLabel,
    `Observed ${dateLabel}`,
    `Verification: ${verificationLabel(record.verificationStatus)}`,
    `Freshness: ${record.freshnessStatus}`,
    whyUsed,
    `To correct this, go to ${correctionRoute}`,
  ].join(". ");

  return {
    sourceLabel,
    observedAt: record.observedAt,
    verificationState: record.verificationStatus,
    freshnessStatus: record.freshnessStatus,
    whyUsed,
    correctionRoute,
    accessibleSummary,
  };
}

function verificationLabel(status: VerificationStatus): string {
  switch (status) {
    case "verified":
      return "verified";
    case "supported":
      return "supported";
    case "partial":
      return "partial";
    case "uncertain":
      return "uncertain";
    case "inference_only":
      return "inference only — not verified";
    case "unknown":
      return "unknown";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function formatAccessibleDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown date";
  return d.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function validateProvenanceIntegrity(
  record: Pick<
    MapAbleContextRecord,
    "sourceType" | "sourceRef" | "sourceAuthority" | "verificationStatus"
  >,
): { valid: boolean; error: string | null } {
  if (!record.sourceRef || !record.sourceAuthority) {
    return { valid: false, error: "sourceRef and sourceAuthority are required" };
  }
  const check = assertInferenceCannotMasquerade(
    record.sourceType,
    record.verificationStatus,
  );
  return { valid: check.ok, error: check.error };
}

export function isParticipantReported(sourceType: SourceTrustClass): boolean {
  return sourceType === "participant_declared" || sourceType === "community_observation";
}

export function isVerifiedEvidence(sourceType: SourceTrustClass): boolean {
  return (
    sourceType === "verified_system_record" ||
    sourceType === "authenticated_provider_record" ||
    sourceType === "public_authoritative_source"
  );
}
