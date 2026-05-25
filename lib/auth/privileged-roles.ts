import type { MapAbleUserRole } from "@prisma/client";

/** Roles that require MapAble admin approval — never auto-granted from Google email_verified */
export const PRIVILEGED_ROLES_REQUIRING_APPROVAL: MapAbleUserRole[] = [
  "mapable_admin",
  "provider_admin",
  "support_worker",
  "support_coordinator",
  "transport_operator",
  "driver",
  "plan_manager",
];

export function isPrivilegedRole(role: MapAbleUserRole): boolean {
  return PRIVILEGED_ROLES_REQUIRING_APPROVAL.includes(role);
}
