import type { MapAbleUserRole } from "@prisma/client";

/** Roles that must enrol MFA before using privileged features */
export const MFA_REQUIRED_ROLES: MapAbleUserRole[] = [
  "support_worker",
  "driver",
  "provider_admin",
  "transport_operator",
  "plan_manager",
  "mapable_admin",
];

export const STEP_UP_ACTIONS = [
  "view_ndis_plan_documents",
  "export_participant_data",
  "change_payout_billing",
  "issue_refund",
  "change_roles_permissions",
  "view_incident_safeguarding",
  "approve_high_value_invoice",
  "view_participant_notes",
  "view_trip_pickup_details",
] as const;

export type StepUpAction = (typeof STEP_UP_ACTIONS)[number];

const ROLE_STEP_UP_ACTIONS: Partial<
  Record<MapAbleUserRole, StepUpAction[]>
> = {
  participant: [
    "view_ndis_plan_documents",
    "export_participant_data",
  ],
  family_member: [
    "view_ndis_plan_documents",
    "export_participant_data",
  ],
  support_worker: ["view_participant_notes", "view_incident_safeguarding"],
  driver: ["view_trip_pickup_details"],
  provider_admin: [
    "change_payout_billing",
    "issue_refund",
    "approve_high_value_invoice",
    "view_incident_safeguarding",
    "change_roles_permissions",
  ],
  transport_operator: [
    "change_payout_billing",
    "view_trip_pickup_details",
  ],
  plan_manager: [
    "change_payout_billing",
    "approve_high_value_invoice",
    "view_ndis_plan_documents",
  ],
  mapable_admin: [
    "export_participant_data",
    "change_roles_permissions",
    "view_incident_safeguarding",
    "issue_refund",
    "change_payout_billing",
  ],
};

const GLOBAL_STEP_UP_ACTIONS: StepUpAction[] = [
  "view_ndis_plan_documents",
  "export_participant_data",
  "change_payout_billing",
  "issue_refund",
  "change_roles_permissions",
  "view_incident_safeguarding",
  "approve_high_value_invoice",
];

export function roleRequiresMfaEnrollment(role: MapAbleUserRole): boolean {
  return MFA_REQUIRED_ROLES.includes(role);
}

export function actionRequiresStepUp(
  action: StepUpAction,
  role: MapAbleUserRole,
): boolean {
  if (GLOBAL_STEP_UP_ACTIONS.includes(action)) {
    const roleActions = ROLE_STEP_UP_ACTIONS[role];
    if (roleActions?.includes(action)) return true;
    if (
      role === "mapable_admin" ||
      role === "provider_admin" ||
      role === "plan_manager"
    ) {
      return true;
    }
  }
  return ROLE_STEP_UP_ACTIONS[role]?.includes(action) ?? false;
}

export function stepUpActionLabel(action: StepUpAction): string {
  const labels: Record<StepUpAction, string> = {
    view_ndis_plan_documents: "View NDIS plan documents",
    export_participant_data: "Export participant data",
    change_payout_billing: "Change payout or billing details",
    issue_refund: "Issue a refund",
    change_roles_permissions: "Change roles or permissions",
    view_incident_safeguarding: "View incident or safeguarding records",
    approve_high_value_invoice: "Approve a high-value invoice",
    view_participant_notes: "View participant support notes",
    view_trip_pickup_details: "View trip pickup details",
  };
  return labels[action] ?? action;
}

export const STEP_UP_DURATION_MS = 15 * 60 * 1000;
export const TRUSTED_DEVICE_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
