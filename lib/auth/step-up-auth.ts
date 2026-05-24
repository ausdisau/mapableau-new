/** Placeholder for future step-up authentication on sensitive actions. */
export const STEP_UP_SENSITIVE_ACTIONS = [
  "view_ndis_documents",
  "approve_high_value_invoice",
  "change_payout_details",
  "change_roles_permissions",
  "export_participant_data",
  "view_incident_records",
  "disconnect_integrations",
] as const;

export type StepUpSensitiveAction = (typeof STEP_UP_SENSITIVE_ACTIONS)[number];

export interface StepUpRequirement {
  required: boolean;
  action: StepUpSensitiveAction;
  reason: string;
}

export function requiresStepUpAuth(action: StepUpSensitiveAction): StepUpRequirement {
  return {
    required: true,
    action,
    reason: "This action requires additional verification (step-up auth placeholder).",
  };
}

export async function assertStepUpAuth(_action: StepUpSensitiveAction): Promise<void> {
  // Placeholder: integrate Auth0 step-up / MFA challenge before enabling.
  return;
}
