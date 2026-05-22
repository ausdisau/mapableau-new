import type { MapAbleUserRole } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

import { isAdminRole } from "./roles";

export type Permission =
  | "profile:read:self"
  | "profile:read:any"
  | "profile:write:self"
  | "profile:write:any"
  | "accessibility:read:self"
  | "accessibility:read:any"
  | "accessibility:write:self"
  | "consent:manage:self"
  | "consent:read:any"
  | "organisation:manage"
  | "booking:create"
  | "booking:read:self"
  | "booking:read:any"
  | "booking:manage:any"
  | "notification:read:self"
  | "audit:read"
  | "admin:dashboard";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  participant: [
    "profile:read:self",
    "profile:write:self",
    "accessibility:read:self",
    "accessibility:write:self",
    "consent:manage:self",
    "booking:create",
    "booking:read:self",
    "notification:read:self",
  ],
  family_member: [
    "profile:read:self",
    "booking:read:self",
    "notification:read:self",
  ],
  support_coordinator: [
    "profile:read:any",
    "booking:read:any",
    "notification:read:self",
  ],
  support_worker: ["booking:read:any", "notification:read:self"],
  provider_admin: ["booking:read:any", "notification:read:self"],
  transport_operator: ["booking:read:any", "notification:read:self"],
  driver: ["booking:read:any", "notification:read:self"],
  employer: ["notification:read:self"],
  plan_manager: ["booking:read:any", "notification:read:self"],
  mapable_admin: [
    "profile:read:any",
    "profile:write:any",
    "accessibility:read:any",
    "consent:read:any",
    "organisation:manage",
    "booking:read:any",
    "booking:manage:any",
    "audit:read",
    "admin:dashboard",
    "notification:read:self",
  ],
};

export function getPermissionsForRole(
  role: UserRole | MapAbleUserRole
): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] ?? [];
}

export function hasPermission(
  role: UserRole | MapAbleUserRole,
  permission: Permission
): boolean {
  if (isAdminRole(role)) return true;
  return getPermissionsForRole(role).includes(permission);
}

export function canViewParticipantProfile(
  actorRole: UserRole | MapAbleUserRole,
  actorId: string,
  participantUserId: string
): boolean {
  if (actorId === participantUserId) return true;
  if (isAdminRole(actorRole)) return true;
  if (
    actorRole === "support_coordinator" ||
    actorRole === "family_member"
  ) {
    return true;
  }
  return false;
}
