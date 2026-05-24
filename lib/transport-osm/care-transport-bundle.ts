import { createBooking } from "@/lib/bookings/booking-service";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function createCareTransportBundle(params: {
  participantId: string;
  createdById: string;
  careTitle: string;
  careDescription: string;
  carePreferredDate?: Date;
  pickupAddress: string;
  dropoffAddress: string;
  pickupWindowStart: Date;
  pickupWindowEnd?: Date;
  accessNeeds?: object;
  mobilityAidSnapshot?: object;
  vehicleRequirements?: object;
  communicationPreferences?: object;
  companionCount?: number;
  pickupNotes?: string;
}) {
  const booking = await createBooking({
    participantId: params.participantId,
    createdById: params.createdById,
    bookingType: "care_transport",
    requestedStart: params.pickupWindowStart.toISOString(),
    requestedEnd: params.pickupWindowEnd?.toISOString(),
    pickupAddress: params.pickupAddress,
    dropoffAddress: params.dropoffAddress,
    shareAccessibility: false,
    status: "requested",
  });

  const careRequest = await prisma.careRequest.create({
    data: {
      participantId: params.participantId,
      requestType: "appointment_support",
      title: params.careTitle,
      description: params.careDescription,
      preferredDate: params.carePreferredDate,
      linkedTransportRequired: true,
      status: "submitted",
      createdById: params.createdById,
      bookingId: booking.id,
    },
  });

  const transport = await createTransportBooking({
    participantId: params.participantId,
    pickupAddress: params.pickupAddress,
    dropoffAddress: params.dropoffAddress,
    pickupWindowStart: params.pickupWindowStart,
    pickupWindowEnd: params.pickupWindowEnd,
    mobilityAidSnapshot: params.mobilityAidSnapshot,
    vehicleRequirements: params.vehicleRequirements,
    pickupNotes: params.pickupNotes,
    careRequestId: careRequest.id,
    status: "draft",
  });

  await prisma.transportBooking.update({
    where: { id: transport.id },
    data: {
      bookingId: booking.id,
      accessNeeds: params.accessNeeds ?? {},
      communicationPreferences: params.communicationPreferences ?? {},
      companionCount: params.companionCount ?? 0,
    },
  });

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "care_transport_link_created",
      careRequestId: careRequest.id,
      transportBookingId: transport.id,
      bookingId: booking.id,
      createdById: params.createdById,
      metadata: { bundle: true },
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "transport.care_bundle_created",
    entityType: "TransportBooking",
    entityId: transport.id,
    participantId: params.participantId,
  });

  return { booking, careRequest, transport };
}
