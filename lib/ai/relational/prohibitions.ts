/**
 * Permanent Relational Intelligence prohibitions (Prompt 01).
 * Operational domains remain unreachable regardless of feature flags.
 */

export const RELATIONAL_PROHIBITED_OPERATIONAL_CAPABILITIES = [
  "care.plan.write",
  "care.appointment.book",
  "care.clinical.diagnose",
  "transport.book",
  "transport.dispatch",
  "jobs.apply",
  "jobs.offer.accept",
  "payment.charge",
  "payment.refund",
  "admin.impersonate",
] as const;

export const RELATIONAL_PROHIBITED_INFERENCES = [
  "infer_emotion_from_biometric_or_communication",
  "infer_deception_from_behaviour_or_biometric",
  "infer_employability_from_disability_or_communication",
  "infer_risk_score_from_disability_or_engagement",
  "infer_profitability_or_service_difficulty",
  "infer_capacity_from_communication_style",
  "infer_consent_from_behaviour",
  "infer_goals_from_diagnosis",
  "infer_loneliness_compliance_motivation_or_risk_from_engagement",
] as const;

export function isProhibitedOperationalCapability(key: string): boolean {
  return (
    RELATIONAL_PROHIBITED_OPERATIONAL_CAPABILITIES as readonly string[]
  ).includes(key);
}

export function isProhibitedInference(action: string): boolean {
  return (RELATIONAL_PROHIBITED_INFERENCES as readonly string[]).includes(
    action,
  );
}

export function assertNotProhibitedOperational(key: string): void {
  if (isProhibitedOperationalCapability(key)) {
    throw new Error(`RELATIONAL_PROHIBITED_OPERATIONAL:${key}`);
  }
}

export function assertNotProhibitedInference(action: string): void {
  if (isProhibitedInference(action)) {
    throw new Error(`RELATIONAL_PROHIBITED_INFERENCE:${action}`);
  }
}
