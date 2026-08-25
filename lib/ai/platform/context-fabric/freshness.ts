import type {
  FreshnessStatus,
  MapAbleContextRecord,
  SourceTrustClass,
  VerificationStatus,
} from "./types";
import { VERIFIED_TRUST_CLASSES } from "./types";
import { getFreshnessPolicy } from "./registry";

/**
 * Deterministic freshness evaluation per context type.
 * unknown ≠ missing — unknown means observation age cannot be determined.
 */
export function evaluateFreshness(input: {
  contextType: MapAbleContextRecord["contextType"];
  observedAt: string;
  effectiveUntil?: string;
  now?: Date;
}): FreshnessStatus {
  const now = input.now ?? new Date();
  const observed = new Date(input.observedAt);

  if (Number.isNaN(observed.getTime())) {
    return "unknown";
  }

  if (input.effectiveUntil) {
    const until = new Date(input.effectiveUntil);
    if (!Number.isNaN(until.getTime()) && now.getTime() >= until.getTime()) {
      return "expired";
    }
  }

  const policy = getFreshnessPolicy(input.contextType);
  const ageHours = (now.getTime() - observed.getTime()) / (60 * 60 * 1000);

  if (policy.expireAfterHours !== null && ageHours >= policy.expireAfterHours) {
    return "expired";
  }
  if (ageHours >= policy.staleMaxHours) return "stale";
  if (ageHours >= policy.agingMaxHours) return "aging";
  if (ageHours >= policy.currentMaxHours) return "aging";
  return "current";
}

export function refreshRecordFreshness(
  record: MapAbleContextRecord,
  now?: Date,
): MapAbleContextRecord {
  return {
    ...record,
    freshnessStatus: evaluateFreshness({
      contextType: record.contextType,
      observedAt: record.observedAt,
      effectiveUntil: record.effectiveUntil,
      now,
    }),
  };
}

export function isStaleOrWorse(status: FreshnessStatus): boolean {
  return status === "stale" || status === "expired";
}

export function verificationForSourceTrust(
  sourceType: SourceTrustClass,
): VerificationStatus {
  if (sourceType === "model_inference") return "inference_only";
  if (VERIFIED_TRUST_CLASSES.includes(sourceType)) return "verified";
  if (sourceType === "human_operator_record") return "supported";
  if (sourceType === "participant_declared") return "supported";
  if (sourceType === "community_observation") return "partial";
  return "uncertain";
}

/** Model inference must never be labelled as verified system evidence. */
export function assertInferenceCannotMasquerade(
  sourceType: SourceTrustClass,
  verificationStatus: VerificationStatus,
): { ok: boolean; error: string | null } {
  if (
    sourceType === "model_inference" &&
    (verificationStatus === "verified" || verificationStatus === "supported")
  ) {
    return {
      ok: false,
      error: "model_inference cannot carry verified/supported verification status",
    };
  }
  if (
    verificationStatus === "verified" &&
    !VERIFIED_TRUST_CLASSES.includes(sourceType)
  ) {
    return {
      ok: false,
      error: `sourceType ${sourceType} cannot claim verified status`,
    };
  }
  return { ok: true, error: null };
}
