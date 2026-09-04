import type { GuardianReasonCode } from "./reason-codes";

/**
 * Purpose allowlist for Guardian-mediated processing.
 * Fail closed: unknown purposes are denied.
 */
export const GUARDIAN_ALLOWED_PURPOSES = [
  "support_request_analysis",
  "safeguarding_classification",
  "complaint_intake_assist",
  "incident_intake_assist",
  "pii_pre_detection",
  "prompt_injection_screening",
  "content_safety_screening",
  "plain_language_explanation",
  "shift_support_context_minimised",
  "accessibility_adaptation",
  "worker_readiness_policy_check",
  "participant_challenge_explanation",
  "audit_transparency",
] as const;

export type GuardianPurpose = (typeof GUARDIAN_ALLOWED_PURPOSES)[number];

const ALLOWED = new Set<string>(GUARDIAN_ALLOWED_PURPOSES);

const MARKETING_PURPOSES = new Set([
  "direct_marketing",
  "marketing",
  "promotional_outreach",
  "advertising",
]);

export type PurposePolicyResult =
  | { allowed: true; purpose: GuardianPurpose }
  | {
      allowed: false;
      reasonCodes: GuardianReasonCode[];
    };

export function evaluatePurposePolicy(purpose: string): PurposePolicyResult {
  const normalised = purpose.trim().toLowerCase();
  if (MARKETING_PURPOSES.has(normalised)) {
    return {
      allowed: false,
      reasonCodes: ["PURPOSE_MARKETING_PROHIBITED", "PURPOSE_NOT_ALLOWED"],
    };
  }
  if (!ALLOWED.has(normalised)) {
    return {
      allowed: false,
      reasonCodes: ["PURPOSE_NOT_ALLOWED"],
    };
  }
  return { allowed: true, purpose: normalised as GuardianPurpose };
}

/** Consent scopes typically required for sensitive purposes. */
export function requiredConsentScopesForPurpose(
  purpose: GuardianPurpose
): string[] {
  switch (purpose) {
    case "safeguarding_classification":
    case "complaint_intake_assist":
    case "incident_intake_assist":
      return ["care.share", "safeguarding.disclose"];
    case "shift_support_context_minimised":
      return ["care.share"];
    case "support_request_analysis":
      return ["care.share"];
    case "pii_pre_detection":
    case "prompt_injection_screening":
    case "content_safety_screening":
      return [];
    default:
      return [];
  }
}
