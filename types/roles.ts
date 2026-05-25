import type { UserRole } from "@/types/mapable";

/** Platform roles (prompt pack aliases mapped to MapAble enums). */
export type PlatformRole =
  | UserRole
  | "nominee_or_family"
  | "allied_health_practitioner"
  | "quality_safeguarding_lead"
  | "admin";

export type ProfileRoleStatus = "pending" | "active" | "suspended" | "revoked";

export interface ProfileRole {
  id: string;
  profileId: string;
  role: UserRole;
  status: ProfileRoleStatus;
  isPrimary: boolean;
  approvedAt?: Date | null;
  approvedById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Roles that require admin verification before becoming active. */
export const PRIVILEGED_ROLES_REQUIRING_APPROVAL: UserRole[] = [
  "provider_admin",
  "transport_operator",
  "support_worker",
  "driver",
  "plan_manager",
  "mapable_admin",
];

export const AUTO_APPROVED_ROLES: UserRole[] = ["participant", "family_member"];

export function mapPromptRoleToUserRole(role: PlatformRole): UserRole {
  const map: Record<string, UserRole> = {
    nominee_or_family: "family_member",
    allied_health_practitioner: "support_worker",
    quality_safeguarding_lead: "mapable_admin",
    admin: "mapable_admin",
  };
  if (role in map) return map[role as string];
  return role as UserRole;
}

export function roleRequiresApproval(role: UserRole): boolean {
  return PRIVILEGED_ROLES_REQUIRING_APPROVAL.includes(role);
}
