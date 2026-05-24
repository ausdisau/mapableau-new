export const STEP_UP_ACTIONS = [
  "view_ndis_plan_documents",
  "change_payout_details",
  "approve_high_value_invoice",
  "export_participant_data",
  "view_safeguarding_records",
  "change_roles",
  "create_api_key",
  "disable_mfa_passkeys",
] as const;

export type StepUpAction = (typeof STEP_UP_ACTIONS)[number];

export const STEP_UP_TTL_MS = 10 * 60 * 1000;

export function requiresStepUp(action: string): action is StepUpAction {
  return (STEP_UP_ACTIONS as readonly string[]).includes(action);
}
