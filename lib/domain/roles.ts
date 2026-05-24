export {
  ALL_ROLES,
  ADMIN_ROLES,
  PARTICIPANT_FAMILY_ROLES,
  SUPPORT_ROLES,
  isAdminRole,
  roleLabel,
  defaultDashboardPath,
} from "@/lib/auth/roles";

import type { UserRole } from "@/types/mapable";

/** Roles that can act on behalf of a participant for bookings and invoices. */
export const PARTICIPANT_ACTOR_ROLES: UserRole[] = [
  "participant",
  "family_member",
];

/** Roles that manage provider-side booking operations. */
export const PROVIDER_ACTOR_ROLES: UserRole[] = [
  "provider_admin",
  "transport_operator",
  "support_worker",
  "driver",
];

export function isParticipantActor(role: UserRole): boolean {
  return PARTICIPANT_ACTOR_ROLES.includes(role);
}

export function isProviderActor(role: UserRole): boolean {
  return PROVIDER_ACTOR_ROLES.includes(role);
}
