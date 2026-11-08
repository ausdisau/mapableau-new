/**
 * Stage 0 capability-contract types for bounded digital autonomy.
 *
 * Not an execution plane. Do not import this module from live agent, payment,
 * safeguarding or device-control paths. The first product ceiling is L2
 * (pre-authorised reversible digital tasks) under an opt-in standing instruction.
 * L5 is never a deployment target.
 */

export const AUTONOMY_LEVELS = [
  "L0_explain",
  "L1_draft",
  "L2_preauthorised",
  "L3_supervised_coordination",
  "L4_high_impact_handoff",
  "L5_unrestricted",
] as const;

export type AutonomyLevel = (typeof AUTONOMY_LEVELS)[number];

/** First-release product ceiling (Decision 1). Not an NDIS or TGA rating. */
export const AUTONOMY_FIRST_RELEASE_CEILING: AutonomyLevel = "L2_preauthorised";

export const AUTONOMY_UNACCEPTABLE_TARGET: AutonomyLevel = "L5_unrestricted";

export type CapabilityManifest = {
  version: number;
  actorUserId: string;
  participantId: string;
  tenantId: string;
  allowedAction: string;
  purpose: string;
  dataFields: string[];
  costLimitAud?: number | null;
  contactCeiling: number;
  scheduleWindowStart: string | null;
  scheduleWindowEnd: string | null;
  geography?: string | null;
  deviceBoundary?: string | null;
  consentRecordId: string;
  consentRevision: string;
  expiresAt: string;
  permittedRetries: number;
  reversible: boolean;
  auditCorrelationId: string;
  fallbackInstruction: string;
  autonomyLevel: AutonomyLevel;
};

export function isDeployableAutonomyLevel(level: AutonomyLevel): boolean {
  switch (level) {
    case "L0_explain":
    case "L1_draft":
    case "L2_preauthorised":
      return true;
    case "L3_supervised_coordination":
    case "L4_high_impact_handoff":
      return false;
    case "L5_unrestricted":
      return false;
    default: {
      const exhaustive: never = level;
      throw new Error(`Unhandled autonomy level: ${String(exhaustive)}`);
    }
  }
}

export function assertAutonomyCeiling(level: AutonomyLevel): void {
  if (level === AUTONOMY_UNACCEPTABLE_TARGET) {
    throw new Error(
      "L5 unrestricted self-direction is not an acceptable deployment target.",
    );
  }
}
