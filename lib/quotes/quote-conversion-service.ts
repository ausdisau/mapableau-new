import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordParticipantTimelineEvent } from "@/lib/timeline/timeline-service";

export async function acceptQuoteResponse(
  quoteRequestId: string,
  responseId: string,
  actorUserId: string
) {
  await prisma.quoteResponse.updateMany({
    where: { quoteRequestId },
    data: { accepted: false },
  });

  const response = await prisma.quoteResponse.update({
    where: { id: responseId },
    data: { accepted: true },
  });

  const quote = await prisma.quoteRequest.update({
    where: { id: quoteRequestId },
    data: { status: "accepted" },
  });

  await recordParticipantTimelineEvent({
    participantId: quote.participantId,
    eventType: "quote_accepted",
    title: "Quote accepted",
    summary: quote.title,
    sourceType: "QuoteRequest",
    sourceId: quote.id,
  });

  await createAuditEvent({
    actorUserId,
    action: "quote.accepted",
    entityType: "QuoteRequest",
    entityId: quoteRequestId,
    participantId: quote.participantId,
  });

  return { quote, response };
}

export async function convertQuoteToBooking(params: {
  quoteRequestId: string;
  actorUserId: string;
}) {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: params.quoteRequestId },
  });
  if (!quote) throw new Error("QUOTE_NOT_FOUND");

  const booking = await prisma.booking.create({
    data: {
      participantId: quote.participantId,
      createdById: params.actorUserId,
      status: "draft",
      bookingType: "care",
      requestedStart: new Date(),
      participantNotes: `Created from quote: ${quote.title}`,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "quote.converted_to_booking",
    entityType: "Booking",
    entityId: booking.id,
    participantId: quote.participantId,
    metadata: { quoteRequestId: quote.id },
  });

  return booking;
}
