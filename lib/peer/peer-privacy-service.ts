import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { updatePeerPrivacySchema } from "@/lib/validation/peer";
import type { z } from "zod";

export async function updatePeerPrivacy(
  userId: string,
  peerProfileId: string,
  data: z.infer<typeof updatePeerPrivacySchema>
) {
  const settings = await prisma.peerPrivacySettings.upsert({
    where: { peerProfileId },
    create: {
      peerProfileId,
      pauseCommunityNotifications: data.pauseCommunityNotifications ?? false,
      lockScreenSafeOnly: data.lockScreenSafeOnly ?? true,
      mutedCircleIds: data.mutedCircleIds ?? [],
    },
    update: {
      pauseCommunityNotifications: data.pauseCommunityNotifications,
      lockScreenSafeOnly: data.lockScreenSafeOnly,
      mutedCircleIds: data.mutedCircleIds,
    },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.privacy.updated",
    entityType: "PeerPrivacySettings",
    entityId: settings.id,
  });

  return settings;
}
