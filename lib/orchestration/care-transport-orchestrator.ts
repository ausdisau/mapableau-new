import { phase3Config } from "@/lib/config/phase3";
import { ensureBookingForCareRequest } from "@/lib/modules/care-facade";
import { prisma } from "@/lib/prisma";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";

export async function createLinkedTransportFromCareRequest(
  careRequestId: string,
  actorUserId: string,
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true, reason: "Orchestration disabled" };
  }

  const key = `care-transport-${careRequestId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing?.transportBookingId) {
    return { duplicate: true, transportBookingId: existing.transportBookingId };
  }

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request || !request.linkedTransportRequired) {
    throw new Error("LINK_NOT_REQUESTED");
  }

  const start = request.preferredDate ?? new Date();
  const booking = await ensureBookingForCareRequest(careRequestId, actorUserId);
  const tb = await createTransportBooking({
    participantId: request.participantId,
    pickupAddress: request.address ?? "Address to be confirmed",
    dropoffAddress: request.address ?? "Care location",
    pickupWindowStart: start,
    shareAccessibility: request.shareAccessibility,
    shareAccessibilityConfirmed: request.shareAccessibility,
    pickupNotes: "Linked to care request",
    careRequestId,
    bookingId: booking.id,
    status: "draft",
  });

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "care_transport_link_created",
      careRequestId,
      transportBookingId: tb.id,
      idempotencyKey: key,
      createdById: actorUserId,
      metadata: { careRequestId },
    },
  });

  return { transportBooking: tb };
}
