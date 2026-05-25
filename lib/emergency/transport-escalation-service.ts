import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createBooking } from "@/lib/bookings/booking-service";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import { prisma } from "@/lib/prisma";

export async function requestEmergencyTransport(params: {
  participantId: string;
  actorUserId: string;
  pickupAddress: string;
  dropoffAddress: string;
  urgencyNotes?: string;
}) {
  const profile = await prisma.emergencyProfile.findUnique({
    where: { participantId: params.participantId },
  });

  const pickup =
    params.pickupAddress ||
    profile?.defaultPickupAddress ||
    "Address on file — confirm with participant";

  const booking = await createBooking({
    participantId: params.participantId,
    createdById: params.actorUserId,
    bookingType: "transport",
    requestedStart: new Date().toISOString(),
    pickupAddress: pickup,
    dropoffAddress: params.dropoffAddress,
    participantNotes: params.urgencyNotes
      ? `EMERGENCY ESCALATION: ${params.urgencyNotes}`
      : "MapAble Emergency transport escalation",
    status: "requested",
    shareAccessibility: false,
  });

  const tb = await createTransportBooking({
    participantId: params.participantId,
    pickupAddress: pickup,
    dropoffAddress: params.dropoffAddress,
    pickupWindowStart: new Date(),
    pickupNotes: params.urgencyNotes ?? "Emergency escalation — priority handling",
    status: "requested",
  });

  const request = await prisma.emergencyTransportRequest.create({
    data: {
      participantId: params.participantId,
      pickupAddress: pickup,
      dropoffAddress: params.dropoffAddress,
      urgencyNotes: params.urgencyNotes,
      bookingId: booking.id,
      transportBookingId: tb.id,
      status: "requested",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "emergency.transport.requested",
    entityType: "EmergencyTransportRequest",
    entityId: request.id,
    participantId: params.participantId,
    metadata: { bookingId: booking.id, transportBookingId: tb.id },
  });

  return { request, booking, transportBooking: tb };
}
