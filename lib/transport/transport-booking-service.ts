import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { syncBookingStatusForTransportBooking } from "@/lib/bookings/status-sync";
import { syncCalendarForTransport } from "@/lib/calendar/calendar-service";
import { checkConsent } from "@/lib/consent/consent-service";
import { finaliseTransportBookingSpine } from "@/lib/modules/transport-facade";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

export async function createTransportBooking(params: {
  participantId: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupWindowStart: Date;
  pickupWindowEnd?: Date;
  transportType?: "one_way" | "return_trip";
  mobilityAidSnapshot?: object;
  vehicleRequirements?: object;
  shareAccessibility?: boolean;
  shareAccessibilityConfirmed?: boolean;
  driverAssistanceRequired?: boolean;
  pickupNotes?: string;
  dropoffNotes?: string;
  careRequestId?: string;
  bookingId?: string;
  status?: "draft" | "requested";
}) {
  if (params.shareAccessibility && params.shareAccessibilityConfirmed) {
    const ok = await checkConsent({
      subjectUserId: params.participantId,
      scope: "transport.accessibility_share",
    });
    if (!ok) throw new Error("CONSENT_REQUIRED");
  }

  const tb = await prisma.transportBooking.create({
    data: {
      participantId: params.participantId,
      transportType: params.transportType ?? "one_way",
      pickupAddress: params.pickupAddress,
      dropoffAddress: params.dropoffAddress,
      pickupWindowStart: params.pickupWindowStart,
      pickupWindowEnd: params.pickupWindowEnd,
      mobilityAidSnapshot: params.mobilityAidSnapshot,
      vehicleRequirements: params.vehicleRequirements ?? {},
      shareAccessibility: params.shareAccessibility ?? false,
      driverAssistanceRequired: params.driverAssistanceRequired ?? false,
      pickupNotes: params.pickupNotes,
      dropoffNotes: params.dropoffNotes,
      careRequestId: params.careRequestId,
      bookingId: params.bookingId,
      status: params.status ?? "requested",
    },
  });

  await syncCalendarForTransport(tb, params.participantId);
  await createAuditEvent({
    actorUserId: params.participantId,
    action: "transport_booking.created",
    entityType: "TransportBooking",
    entityId: tb.id,
    participantId: params.participantId,
  });

  return finaliseTransportBookingSpine(tb, params.participantId);
}

export async function assignTransportOperator(
  transportBookingId: string,
  organisationId: string,
  _adminUserId: string,
) {
  const booking = await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: {
      operatorOrganisationId: organisationId,
      status: "awaiting_operator_response",
    },
  });
  await syncBookingStatusForTransportBooking(transportBookingId, _adminUserId);
  return booking;
}

export async function acceptTransportBooking(id: string, _actorUserId: string) {
  const tb = await prisma.transportBooking.update({
    where: { id },
    data: { status: "operator_accepted" },
  });
  await syncBookingStatusForTransportBooking(id, _actorUserId);
  await notifyUser(
    tb.participantId,
    "booking",
    "Transport booking accepted",
    "Your transport operator has accepted your trip request.",
  );
  return tb;
}
