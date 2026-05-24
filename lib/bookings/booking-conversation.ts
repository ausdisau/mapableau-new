import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

/**
 * Ensures a booking_thread conversation exists for messaging.
 */
export async function ensureBookingConversation(params: {
  bookingId: string;
  participantId: string;
  createdById: string;
  title: string;
  organisationId?: string | null;
}): Promise<string> {
  const existing = await prisma.conversation.findFirst({
    where: { bookingId: params.bookingId, type: "booking_thread" },
    select: { id: true },
  });
  if (existing) return existing.id;

  const conv = await prisma.conversation.create({
    data: {
      type: "booking_thread",
      title: params.title,
      bookingId: params.bookingId,
      participantId: params.participantId,
      organisationId: params.organisationId ?? undefined,
      createdById: params.createdById,
      lastMessageAt: new Date(),
      participants: {
        create: [{ userId: params.participantId }],
      },
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "conversation.created",
    entityType: "Conversation",
    entityId: conv.id,
    participantId: params.participantId,
    organisationId: params.organisationId ?? undefined,
    metadata: { bookingId: params.bookingId },
  });

  return conv.id;
}
