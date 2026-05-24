import type {
  BookingStatus,
  CareRequestStatus,
  CareShiftStatus,
  TransportBookingStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function mapCareRequestStatusToBooking(
  status: CareRequestStatus,
): BookingStatus | null {
  const map: Partial<Record<CareRequestStatus, BookingStatus>> = {
    submitted: "requested",
    awaiting_admin_review: "requested",
    awaiting_provider_response: "awaiting_provider_acceptance",
    matched: "awaiting_provider_acceptance",
    confirmed: "confirmed",
    in_progress: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
    disputed: "disputed",
  };
  return map[status] ?? null;
}

export function mapTransportStatusToBooking(
  status: TransportBookingStatus,
): BookingStatus | null {
  const map: Partial<Record<TransportBookingStatus, BookingStatus>> = {
    requested: "requested",
    awaiting_operator_response: "awaiting_provider_acceptance",
    operator_accepted: "confirmed",
    driver_assigned: "confirmed",
    vehicle_assigned: "confirmed",
    confirmed: "confirmed",
    driver_en_route: "in_progress",
    arrived_for_pickup: "in_progress",
    participant_on_board: "in_progress",
    in_transit: "in_progress",
    arrived_at_destination: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
    disputed: "disputed",
  };
  return map[status] ?? null;
}

export function mapCareShiftStatusToBooking(
  status: CareShiftStatus,
): BookingStatus | null {
  const map: Partial<Record<CareShiftStatus, BookingStatus>> = {
    checked_in: "in_progress",
    in_progress: "in_progress",
    checked_out: "in_progress",
    awaiting_participant_approval: "in_progress",
    approved: "completed",
    completed: "completed",
    cancelled: "cancelled",
    disputed: "disputed",
  };
  return map[status] ?? null;
}

export async function syncBookingStatusFromCareRequest(
  careRequestId: string,
): Promise<void> {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    select: { bookingId: true, status: true },
  });
  if (!request?.bookingId) return;
  const next = mapCareRequestStatusToBooking(request.status);
  if (!next) return;
  await prisma.booking.update({
    where: { id: request.bookingId },
    data: { status: next },
  });
}

export async function syncBookingStatusFromTransport(
  transportBookingId: string,
): Promise<void> {
  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    select: { bookingId: true, status: true },
  });
  if (!tb?.bookingId) return;
  const next = mapTransportStatusToBooking(tb.status);
  if (!next) return;
  await prisma.booking.update({
    where: { id: tb.bookingId },
    data: { status: next },
  });
}

export async function syncBookingStatusFromCareShift(
  careShiftId: string,
): Promise<void> {
  const shift = await prisma.careShift.findUnique({
    where: { id: careShiftId },
    select: { bookingId: true, status: true },
  });
  if (!shift?.bookingId) return;
  const next = mapCareShiftStatusToBooking(shift.status);
  if (!next) return;
  await prisma.booking.update({
    where: { id: shift.bookingId },
    data: { status: next },
  });
}
