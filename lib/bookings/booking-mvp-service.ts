import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isOrganisationBookingEligible } from "@/lib/providers/provider-org-profile-service";
import { prisma } from "@/lib/prisma";

export async function recordBookingEvent(
  bookingId: string,
  eventType: string,
  actorUserId?: string,
  note?: string,
  metadata?: Record<string, unknown>
) {
  return prisma.bookingEvent.create({
    data: {
      bookingId,
      eventType,
      actorUserId,
      note,
      metadata: metadata as object | undefined,
    },
  });
}

export async function providerAcceptBookingMvp(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note?: string
) {
  const eligible = await isOrganisationBookingEligible(organisationId);
  if (!eligible) throw new Error("PROVIDER_NOT_ELIGIBLE");

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "accepted",
      providerResponseStatus: "accepted",
      providerResponseNote: note,
      providerRespondedAt: new Date(),
      assignedOrganisationId: organisationId,
    },
  });

  await recordBookingEvent(bookingId, "accepted", actorUserId, note);
  await createAuditEvent({
    actorUserId,
    action: "booking.updated",
    entityType: "Booking",
    entityId: bookingId,
    participantId: booking.participantId,
    organisationId,
    metadata: { status: "accepted" },
  });

  return booking;
}

export async function providerDeclineBookingMvp(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note?: string
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "declined",
      providerResponseStatus: "declined",
      providerResponseNote: note,
      providerRespondedAt: new Date(),
    },
  });

  await recordBookingEvent(bookingId, "declined", actorUserId, note);
  await createAuditEvent({
    actorUserId,
    action: "booking.updated",
    entityType: "Booking",
    entityId: bookingId,
    participantId: booking.participantId,
    organisationId,
  });

  return booking;
}

export async function providerRequestMoreInfo(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note: string
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "more_information_requested",
      providerResponseStatus: "sent",
      providerResponseNote: note,
      providerRespondedAt: new Date(),
      assignedOrganisationId: organisationId,
    },
  });

  await recordBookingEvent(bookingId, "more_information_requested", actorUserId, note);
  return booking;
}

export async function linkBookingConversation(
  bookingId: string,
  conversationId: string
) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { bookingId },
  });
}

export async function ensureBookingThread(
  bookingId: string,
  participantId: string,
  organisationId: string,
  createdById: string
) {
  const existing = await prisma.conversation.findFirst({
    where: { bookingId },
  });
  if (existing) return existing;

  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: { members: { take: 1 } },
  });
  const providerUserId = org?.members[0]?.userId;
  const participantIds = [
    participantId,
    ...(providerUserId ? [providerUserId] : []),
  ];

  return prisma.conversation.create({
    data: {
      type: "booking_thread",
      title: `Booking ${bookingId.slice(0, 8)}`,
      bookingId,
      organisationId,
      participantId,
      createdById,
      participants: {
        create: participantIds.map((userId) => ({ userId })),
      },
    },
  });
}
