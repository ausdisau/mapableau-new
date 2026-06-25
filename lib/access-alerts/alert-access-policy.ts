import type { CurrentUser } from "@/lib/auth/current-user";

import { isAccessModerator, isVenueOwner } from "@/lib/access-community/access-role-policy";

export function canCreateAlert(user: CurrentUser | null): boolean {
  return Boolean(user);
}

export async function canResolveAlert(
  user: CurrentUser | null,
  alert: { submittedById: string | null; placeId: string | null }
): Promise<boolean> {
  if (!user) return false;
  if (alert.submittedById === user.id) return true;
  if (await isAccessModerator(user)) return true;
  if (alert.placeId && (await isVenueOwner(user.id, alert.placeId))) {
    return true;
  }
  return false;
}

export function canVerifyContent(user: CurrentUser | null): boolean {
  return Boolean(user);
}
