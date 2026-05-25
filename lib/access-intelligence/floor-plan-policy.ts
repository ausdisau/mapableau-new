import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export function canAdministerFloorPlans(user: CurrentUser | null): boolean {
  return user != null && isAdminRole(user.primaryRole);
}

export async function canManagePlaceFloorPlans(
  user: CurrentUser | null,
  placeId: string,
): Promise<boolean> {
  if (!user) return false;
  if (canAdministerFloorPlans(user)) return true;

  const profile = await prisma.accessVenueProfile.findUnique({
    where: { placeId },
    select: { ownerUserId: true },
  });

  return profile?.ownerUserId === user.id;
}

export function floorPlanSourceTypeForUser(user: CurrentUser) {
  return canAdministerFloorPlans(user) ? "admin_uploaded" : "venue_uploaded";
}
