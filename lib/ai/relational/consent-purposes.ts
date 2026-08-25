/**
 * Relational consent purposes — service assistance vs model training are independent.
 */

export const RELATIONAL_CONSENT_PURPOSES = [
  "relational.service_assistance",
  "relational.memory",
  "relational.data_sharing",
  "relational.human_escalation",
  "relational.model_training",
] as const;

export type RelationalConsentPurpose =
  (typeof RELATIONAL_CONSENT_PURPOSES)[number];

export const RELATIONAL_SERVICE_CONSENT_PURPOSES = [
  "relational.service_assistance",
  "relational.memory",
  "relational.data_sharing",
  "relational.human_escalation",
] as const satisfies readonly RelationalConsentPurpose[];

export const RELATIONAL_TRAINING_CONSENT_PURPOSE =
  "relational.model_training" as const satisfies RelationalConsentPurpose;

export function isRelationalConsentPurpose(
  value: string,
): value is RelationalConsentPurpose {
  return (RELATIONAL_CONSENT_PURPOSES as readonly string[]).includes(value);
}

export function isRelationalTrainingConsentPurpose(value: string): boolean {
  return value === RELATIONAL_TRAINING_CONSENT_PURPOSE;
}

export function isRelationalServiceConsentPurpose(value: string): boolean {
  return (RELATIONAL_SERVICE_CONSENT_PURPOSES as readonly string[]).includes(
    value,
  );
}

/**
 * Service consent never implies training consent.
 * Wrong-purpose or withdrawn consent cannot be reused.
 */
export function assertConsentPurposeUsable(input: {
  grantedPurposes: string[];
  requiredPurpose: RelationalConsentPurpose;
  withdrawnPurposes?: string[];
}): { ok: true } | { ok: false; reason: "missing" | "withdrawn" | "wrong_purpose" } {
  const withdrawn = new Set(input.withdrawnPurposes ?? []);
  if (withdrawn.has(input.requiredPurpose)) {
    return { ok: false, reason: "withdrawn" };
  }
  if (!input.grantedPurposes.includes(input.requiredPurpose)) {
    // Service grant must not unlock training.
    if (
      input.requiredPurpose === RELATIONAL_TRAINING_CONSENT_PURPOSE &&
      input.grantedPurposes.some(isRelationalServiceConsentPurpose)
    ) {
      return { ok: false, reason: "wrong_purpose" };
    }
    return { ok: false, reason: "missing" };
  }
  return { ok: true };
}
