/** AI actions that remain permanently prohibited without human authority. */
export const AI_PROHIBITED_ACTIONS = [
  "change_consent",
  "approve_delegates",
  "assign_workers",
  "certify_competency",
  "prescribe_equipment",
  "clinical_treatment",
  "approve_claims",
  "approve_payments",
  "close_safeguarding",
  "determine_legal_rights",
  "submit_to_regulators",
  "contact_emergency_services",
  "declare_route_safe",
  "publish_participant_information",
] as const;

export type AiProhibitedAction = (typeof AI_PROHIBITED_ACTIONS)[number];

/** Scoring systems that must never ship. */
export const PROHIBITED_SCORE_KINDS = [
  "participant_worthiness",
  "employability",
  "loneliness",
  "participant_burden",
  "universal_accessibility",
  "single_worker_quality",
  "payment_influenced_provider",
  "paid_confidence",
  "sponsored_compatibility",
] as const;

export type ProhibitedScoreKind = (typeof PROHIBITED_SCORE_KINDS)[number];

/** Essential-access pathway prohibitions. */
export const ESSENTIAL_ACCESS_PROHIBITIONS = [
  "smartphone_only",
  "visual_only",
  "qr_only",
  "biometric_only_recovery",
  "app_response_welfare_assumption",
] as const;

export type EssentialAccessProhibition =
  (typeof ESSENTIAL_ACCESS_PROHIBITIONS)[number];

/** State honesty chain — never collapse adjacent steps. */
export const STATE_HONESTY_CHAIN = [
  "discovered",
  "available",
  "compatible",
  "accepted",
  "confirmed",
  "delivered",
  "participant_outcome",
] as const;

export type StateHonestyStep = (typeof STATE_HONESTY_CHAIN)[number];

export function isAiActionProhibited(action: string): boolean {
  return (AI_PROHIBITED_ACTIONS as readonly string[]).includes(action);
}
