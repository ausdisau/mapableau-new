import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Ensures a MapAble user has baseline records after sign-up or OAuth.
 * Does not assign verification, admin rights, or collect NDIS/health data.
 */
export async function ensureUserProfileAfterAuth(
  userId: string,
  primaryRole: MapAbleUserRole,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      participantProfile: { select: { id: true } },
    },
  });

  if (!user) return null;

  if (primaryRole === "participant" && !user.participantProfile) {
    await prisma.participantProfile.create({
      data: {
        userId,
        displayName: user.name || "Participant",
      },
    });
  }

  return user;
}
