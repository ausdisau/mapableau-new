import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createServiceLogFromBooking(params: {
  bookingId: string;
  participantId: string;
  organisationId?: string;
  startedAt?: Date;
  endedAt?: Date;
  deliveredSupports?: unknown[];
  notes?: string;
  actorUserId: string;
}) {
  const existing = await prisma.serviceLog.findFirst({
    where: { bookingId: params.bookingId },
  });
  if (existing) return existing;

  const log = await prisma.serviceLog.create({
    data: {
      bookingId: params.bookingId,
      participantId: params.participantId,
      organisationId: params.organisationId,
      startedAt: params.startedAt,
      endedAt: params.endedAt,
      deliveredSupports: (params.deliveredSupports ?? []) as object,
      notes: params.notes,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "service_log.created",
    entityType: "ServiceLog",
    entityId: log.id,
    participantId: params.participantId,
    organisationId: params.organisationId,
  });

  return log;
}

export async function listServiceLogsForParticipant(participantId: string) {
  return prisma.serviceLog.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
