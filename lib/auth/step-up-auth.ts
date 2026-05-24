import type { MapAbleUserRole } from "@prisma/client";

/**
 * Placeholder for step-up authentication before sensitive actions.
 * Wire to WebAuthn, TOTP, or re-auth session when implemented.
 */
export const SENSITIVE_ACTIONS = [
  "change_payout_details",
  "access_ndis_plan_documents",
  "download_participant_records",
  "change_provider_verification",
  "assign_admin_role",
  "view_safeguarding_records",
  "delete_account_data",
] as const;

export type SensitiveAction = (typeof SENSITIVE_ACTIONS)[number];

const ROLES_REQUIRING_MFA: MapAbleUserRole[] = [
  "mapable_admin",
  "provider_admin",
  "plan_manager",
];

export function roleRequiresMfa(role: MapAbleUserRole): boolean {
  return ROLES_REQUIRING_MFA.includes(role);
}

export async function assertStepUpAuth(_params: {
  userId: string;
  action: SensitiveAction;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  // TODO: enforce MFA / recent re-authentication
  return { ok: true };
}
