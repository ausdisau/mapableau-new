import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function upsertEmergencyProfile(
  participantId: string,
  summaryJson: Record<string, unknown>,
  actorId: string
) {
  if (!remainingSystemsConfig.emergencyModuleEnabled) {
    throw new Error("EMERGENCY_DISABLED");
  }

  const profile = await prisma.emergencyProfile.upsert({
    where: { participantId },
    create: {
      participantId,
      summaryJson: summaryJson as Prisma.InputJsonValue,
    },
    update: { summaryJson: summaryJson as Prisma.InputJsonValue },
  });

  await createAuditEvent({
    actorUserId: actorId,
    action: "emergency.profile_updated",
    entityType: "EmergencyProfile",
    entityId: profile.id,
    participantId,
  });

  return profile;
}

export async function addEmergencyContact(
  profileId: string,
  contact: { name: string; phone: string; relation?: string; priority?: number }
) {
  return prisma.emergencyContact.create({
    data: { profileId, ...contact },
  });
}

export async function recordCheckIn(profileId: string, status: string, notes?: string) {
  return prisma.emergencyCheckIn.create({
    data: { profileId, status, notes },
  });
}

export async function getEmergencyProfile(participantId: string) {
  return prisma.emergencyProfile.findUnique({
    where: { participantId },
    include: { contacts: true, plans: true, checkins: { take: 10, orderBy: { createdAt: "desc" } } },
  });
}
