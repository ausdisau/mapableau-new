import type { CurrentUser } from "@/lib/auth/current-user";
import { userHasRole } from "@/lib/auth/current-user";
import type { UserRole } from "@/types/mapable";

export function requireRole(
  user: CurrentUser,
  ...roles: UserRole[]
): boolean {
  return roles.some((role) => userHasRole(user, role));
}

export function isParticipantFamily(user: CurrentUser): boolean {
  return requireRole(user, "participant", "family_member");
}
