import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { createPeerProfileSchema, updatePeerProfileSchema } from "@/lib/validation/peer";
import type { z } from "zod";

function slugFromUserId(userId: string) {
  return `peer-${userId.slice(0, 12)}`;
}

export async function getPeerProfileByUserId(userId: string) {
  return prisma.peerProfile.findUnique({
    where: { userId },
    include: {
      privacySettings: true,
      user: { select: { name: true } },
    },
  });
}

export async function createPeerProfile(
  userId: string,
  data: z.infer<typeof createPeerProfileSchema>
) {
  const existing = await prisma.peerProfile.findUnique({
    where: { userId },
    include: { privacySettings: true, user: { select: { name: true } } },
  });
  if (existing) return existing;

  const profile = await prisma.peerProfile.create({
    data: {
      userId,
      profileSlug: slugFromUserId(userId),
      displayName: data.displayName,
      displayNameMode: data.displayNameMode,
      livedExperienceTags: data.livedExperienceTags ?? undefined,
      communicationPreferences:
        (data.communicationPreferences as Prisma.InputJsonValue) ?? undefined,
      profileVisibility: data.profileVisibility,
      privacySettings: { create: {} },
    },
    include: { privacySettings: true, user: { select: { name: true } } },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.profile.created",
    entityType: "PeerProfile",
    entityId: profile.id,
    metadata: { displayNameMode: profile.displayNameMode },
  });

  return profile;
}

export async function updatePeerProfile(
  userId: string,
  profileId: string,
  data: z.infer<typeof updatePeerProfileSchema>
) {
  const profile = await prisma.peerProfile.update({
    where: { id: profileId, userId },
    data: {
      displayName: data.displayName,
      displayNameMode: data.displayNameMode,
      livedExperienceTags: data.livedExperienceTags,
      communicationPreferences: data.communicationPreferences as
        | Prisma.InputJsonValue
        | undefined,
      profileVisibility: data.profileVisibility,
    },
    include: { privacySettings: true, user: { select: { name: true } } },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.profile.updated",
    entityType: "PeerProfile",
    entityId: profile.id,
  });

  return profile;
}
