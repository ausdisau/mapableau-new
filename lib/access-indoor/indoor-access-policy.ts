import type { CurrentUser } from "@/lib/auth/current-user";
import { canEditPlace } from "@/lib/access-map/access-place-policy";
import { prisma } from "@/lib/prisma";

export async function canManageIndoorForPlace(
  user: CurrentUser | null,
  placeId: string
): Promise<boolean> {
  if (!user) return false;
  if (canEditPlace(user)) return true;

  const profile = await prisma.accessVenueProfile.findUnique({
    where: { placeId },
    select: { ownerUserId: true },
  });

  return profile?.ownerUserId === user.id;
}
