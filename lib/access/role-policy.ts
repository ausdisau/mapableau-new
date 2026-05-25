import type { MapAbleUserRole } from "@prisma/client";

import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

export type ModuleAccessContext = {
  actorUserId: string;
  actorRole: UserRole;
  participantId?: string;
};

export function requirePermissionForRole(
  role: UserRole,
  permission: Permission
): boolean {
  return hasPermission(role, permission);
}

export function canAccessOwnParticipantData(
  actorUserId: string,
  participantId: string
): boolean {
  return actorUserId === participantId;
}

export function canAccessAsAdmin(role: UserRole): boolean {
  return isAdminRole(role);
}

export function canAccessSupportCoordinatorPortal(role: UserRole): boolean {
  return hasPermission(role, "coordinator:portal");
}

export function canAccessPlanManagerPortal(role: UserRole): boolean {
  return hasPermission(role, "plan_manager:portal");
}

export function canAccessFamilyPortal(role: UserRole): boolean {
  return (
    role === "family_member" ||
    role === "participant" ||
    isAdminRole(role)
  );
}

export function canAccessHomeModifications(role: UserRole): boolean {
  return (
    role === "participant" ||
    role === "family_member" ||
    role === "support_coordinator" ||
    role === "plan_manager" ||
    role === "provider_admin" ||
    isAdminRole(role)
  );
}

export function canAccessProviderHomeModifications(role: UserRole): boolean {
  return role === "provider_admin" || isAdminRole(role);
}

export type AccessDeniedReason =
  | "no_permission"
  | "no_consent"
  | "no_link"
  | "scope_missing"
  | "not_found";

export function accessDeniedMessage(reason: AccessDeniedReason): string {
  switch (reason) {
    case "no_permission":
      return "You do not have permission to access this area. Contact your administrator if you believe this is an error.";
    case "no_consent":
      return "The participant has not granted consent for this information. Ask them to approve access in the Consent Centre.";
    case "no_link":
      return "You are not linked to this participant. A connection must be established before you can view their information.";
    case "scope_missing":
      return "Your access does not include this type of information. The participant can update your permissions.";
    case "not_found":
      return "We could not find what you were looking for, or you do not have access to it.";
    default:
      return "Access denied.";
  }
}

export function actorRoleToPrisma(role: UserRole): MapAbleUserRole {
  return role as MapAbleUserRole;
}
