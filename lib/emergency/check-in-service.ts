import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function createEmergencyCheckIn(params: {
  participantId: string;
  actorUserId: string;
  status: "safe" | "need_help";
  message?: string;
  latitude?: number;
  longitude?: number;
  shareLocation?: boolean;
}) {
  const checkIn = await prisma.emergencyCheckIn.create({
    data: {
      participantId: params.participantId,
      status: params.status,
      message: params.message,
      latitude: params.shareLocation ? params.latitude : undefined,
      longitude: params.shareLocation ? params.longitude : undefined,
      escalated: params.status === "need_help",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "emergency.checkin.created",
    entityType: "EmergencyCheckIn",
    entityId: checkIn.id,
    participantId: params.participantId,
    metadata: { status: params.status },
  });

  if (params.status === "need_help") {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "emergency.checkin.escalated",
      entityType: "EmergencyCheckIn",
      entityId: checkIn.id,
      participantId: params.participantId,
    });

    const contacts = await prisma.emergencyContact.findMany({
      where: {
        participantId: params.participantId,
        notifyOnNeedHelp: true,
      },
    });

    const participant = await prisma.user.findUnique({
      where: { id: params.participantId },
      select: { name: true },
    });

    for (const contact of contacts) {
      if (contact.email) {
        await notifyUser(
          params.participantId,
          "system",
          "Trusted contact notified (in-app)",
          `${participant?.name ?? "Participant"} marked Need help. Contact ${contact.name} by phone: ${contact.phone ?? "see profile"}.`,
        );
      }
    }
  }

  return checkIn;
}
