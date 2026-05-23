import { prisma } from "@/lib/prisma";

export async function getOrCreateTransportConversation(
  transportBookingId: string,
  createdById: string
) {
  const existing = await prisma.conversation.findFirst({
    where: { transportBookingId },
  });
  if (existing) return existing;

  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    include: { participant: true },
  });
  if (!booking) throw new Error("NOT_FOUND");

  const conversation = await prisma.conversation.create({
    data: {
      type: "booking_thread",
      title: `Transport trip ${booking.pickupWindowStart.toLocaleDateString("en-AU")}`,
      participantId: booking.participantId,
      transportBookingId,
      organisationId: booking.operatorOrganisationId,
      createdById,
      participants: {
        create: [{ userId: booking.participantId }],
      },
    },
  });

  return conversation;
}

export async function listTransportMessages(transportBookingId: string) {
  const conversation = await prisma.conversation.findFirst({
    where: { transportBookingId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
  return conversation?.messages ?? [];
}

export async function postTransportMessage(params: {
  transportBookingId: string;
  senderUserId: string;
  body: string;
}) {
  const conversation = await getOrCreateTransportConversation(
    params.transportBookingId,
    params.senderUserId
  );

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderUserId: params.senderUserId,
      body: params.body,
      plainLanguageSummary: params.body.slice(0, 120),
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: new Date() },
  });

  return message;
}
