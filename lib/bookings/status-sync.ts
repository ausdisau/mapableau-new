import type {
  BookingStatus,
  CareRequestStatus,
  CareShiftStatus,
  TransportBookingStatus,
} from "@prisma/client";

import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { prisma } from "@/lib/prisma";

export function bookingStatusFromCareRequest(
  status: CareRequestStatus,
): BookingStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "submitted":
    case "awaiting_admin_review":
      return "requested";
    case "awaiting_provider_response":
    case "matched":
      return "awaiting_provider_acceptance";
    case "confirmed":
      return "confirmed";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "disputed":
      return "disputed";
  }
}

export function bookingStatusFromTransportBooking(
  status: TransportBookingStatus,
): BookingStatus {
  switch (status) {
    case "draft":
      return "draft";
    case "requested":
      return "requested";
    case "awaiting_operator_response":
      return "awaiting_provider_acceptance";
    case "operator_accepted":
    case "driver_assigned":
    case "vehicle_assigned":
    case "confirmed":
      return "confirmed";
    case "driver_en_route":
    case "arrived_for_pickup":
    case "participant_on_board":
    case "in_transit":
    case "arrived_at_destination":
      return "in_progress";
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "disputed":
      return "disputed";
  }
}

export function bookingStatusFromCareShift(
  status: CareShiftStatus,
): BookingStatus {
  switch (status) {
    case "checked_in":
    case "in_progress":
    case "checked_out":
    case "awaiting_participant_approval":
      return "in_progress";
    case "approved":
    case "completed":
      return "completed";
    case "cancelled":
      return "cancelled";
    case "disputed":
      return "disputed";
    default:
      return "confirmed";
  }
}

async function updateBookingStatus(params: {
  bookingId: string | null;
  status: BookingStatus;
  actorUserId?: string;
  title: string;
}) {
  if (!params.bookingId) return null;
  const booking = await prisma.booking.update({
    where: { id: params.bookingId },
    data: { status: params.status },
  });
  const eventType =
    params.status === "completed"
      ? "booking_completed"
      : params.status === "confirmed"
        ? "booking_confirmed"
        : params.status === "requested"
          ? "booking_submitted"
          : "trip_status_updated";
  await recordBookingTimelineEvent({
    bookingId: params.bookingId,
    eventType,
    title: params.title,
    description: `Booking status synced to ${params.status.replace(/_/g, " ")}.`,
    actorUserId: params.actorUserId,
  });
  return booking;
}

export async function syncBookingStatusForCareRequest(
  careRequestId: string,
  actorUserId?: string,
) {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    select: { bookingId: true, status: true },
  });
  if (!request) return null;
  return updateBookingStatus({
    bookingId: request.bookingId,
    status: bookingStatusFromCareRequest(request.status),
    actorUserId,
    title: "Care request status updated",
  });
}

export async function syncBookingStatusForTransportBooking(
  transportBookingId: string,
  actorUserId?: string,
) {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    select: { bookingId: true, status: true },
  });
  if (!booking) return null;
  return updateBookingStatus({
    bookingId: booking.bookingId,
    status: bookingStatusFromTransportBooking(booking.status),
    actorUserId,
    title: "Transport booking status updated",
  });
}

export async function syncBookingStatusForCareShift(
  careShiftId: string,
  actorUserId?: string,
) {
  const shift = await prisma.careShift.findUnique({
    where: { id: careShiftId },
    select: { bookingId: true, status: true },
  });
  if (!shift) return null;
  return updateBookingStatus({
    bookingId: shift.bookingId,
    status: bookingStatusFromCareShift(shift.status),
    actorUserId,
    title: "Care shift status updated",
  });
}
