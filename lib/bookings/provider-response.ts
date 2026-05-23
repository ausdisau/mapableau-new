import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import {
  onBookingAccepted,
  onBookingDeclined,
} from "@/lib/orchestration/booking-orchestrator";
import { prisma } from "@/lib/prisma";

export async function providerAcceptBooking(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note?: string
) {
  return onBookingAccepted({
    bookingId,
    organisationId,
    actorUserId,
    note,
  });
}

export async function providerDeclineBooking(
  bookingId: string,
  organisationId: string,
  actorUserId: string,
  note?: string
) {
  return onBookingDeclined({
    bookingId,
    organisationId,
    actorUserId,
    note,
  });
}

export async function assignBookingToOrganisation(
  bookingId: string,
  organisationId: string,
  actorUserId: string
) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      assignedOrganisationId: organisationId,
      providerResponseStatus: "sent",
      status: "awaiting_provider_acceptance",
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "booking.assigned",
    entityType: "Booking",
    entityId: bookingId,
    organisationId,
  });

  await recordBookingTimelineEvent({
    bookingId,
    eventType: "booking_assigned",
    title: "Booking sent to provider",
    actorUserId,
    isAdminOnly: true,
  });

  return booking;
}
