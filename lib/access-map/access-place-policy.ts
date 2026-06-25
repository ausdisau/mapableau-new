import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { hasCommunityRole } from "@/lib/access-badges/community-role-service";

export function canViewPublishedPlaces(): boolean {
  return true;
}

export function canSuggestPlace(user: CurrentUser | null): boolean {
  return Boolean(user);
}

export function canEditPlace(user: CurrentUser | null): boolean {
  if (!user) return false;
  return (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "accessibility_map:manage")
  );
}

export function canPublishPlace(user: CurrentUser | null): boolean {
  return canEditPlace(user);
}

export function canReportPlace(_user: CurrentUser | null): boolean {
  return true;
}

export async function canSubmitAccessReport(user: CurrentUser | null): Promise<boolean> {
  return Boolean(user);
}

export async function canPublishReportWithoutModeration(
  user: CurrentUser | null
): Promise<boolean> {
  if (!user) return false;
  if (canEditPlace(user)) return true;
  return hasCommunityRole(user.id, "verified_mapper");
}

export async function canModerateAccess(user: CurrentUser | null): Promise<boolean> {
  if (!user) return false;
  if (canEditPlace(user)) return true;
  return hasCommunityRole(user.id, "moderator");
}

export async function canCreateAlert(user: CurrentUser | null): Promise<boolean> {
  return Boolean(user);
}

export async function canVerifyContent(user: CurrentUser | null): Promise<boolean> {
  return Boolean(user);
}
