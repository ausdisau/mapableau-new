/**
 * Re-exports permission checks for prompt-pack compatibility.
 * Canonical implementation: lib/auth/permissions.ts
 */
export {
  hasPermission,
  canViewParticipantProfile,
  type Permission,
} from "./permissions";

export { isAdminRole, roleLabel, defaultDashboardPath, ALL_ROLES } from "./roles";

import type { MapAbleUserRole } from "@prisma/client";

import type { UserRole } from "@/types/mapable";
import { resolvePromptRole } from "@/types/core";

import { hasPermission as checkPermission } from "./permissions";
import type { Permission } from "./permissions";

export function resolveRoleForAuth(
  role: UserRole | MapAbleUserRole | string
): UserRole {
  if (role === "nominee" || role === "carer") {
    return resolvePromptRole(role);
  }
  return role as UserRole;
}

export function roleHasPermission(
  role: UserRole | MapAbleUserRole | string,
  permission: Permission
): boolean {
  return checkPermission(resolveRoleForAuth(role), permission);
}
