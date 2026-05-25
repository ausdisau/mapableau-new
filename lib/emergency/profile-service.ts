import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function getEmergencyProfile(participantId: string) {
  return prisma.emergencyProfile.findUnique({
    where: { participantId },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
    },
  });
}

export async function upsertEmergencyProfile(
  participantId: string,
  data: {
    mobilitySummary?: string;
    communicationNeeds?: string;
    supportNeedsSummary?: string;
    defaultPickupAddress?: string;
    nomineeCanManage?: boolean;
    sharedWithCoordinator?: boolean;
  },
  actorUserId: string,
) {
  const profile = await prisma.emergencyProfile.upsert({
    where: { participantId },
    create: { participantId, ...data },
    update: data,
  });

  await createAuditEvent({
    actorUserId,
    action: "emergency.profile.updated",
    entityType: "EmergencyProfile",
    entityId: profile.id,
    participantId,
  });

  return profile;
}
