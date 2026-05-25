import type { CareRequest, Prisma } from "@prisma/client";

import { createBooking } from "@/lib/bookings/booking-service";
import {
  bookingStatusFromCareRequest,
  syncBookingStatusForCareRequest,
} from "@/lib/bookings/status-sync";
import { prisma } from "@/lib/prisma";

export async function ensureBookingForCareRequest(
  careRequestId: string,
  actorUserId: string,
) {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request) throw new Error("NOT_FOUND");

  if (request.bookingId) {
    return prisma.booking.findUniqueOrThrow({
      where: { id: request.bookingId },
    });
  }

  const requestedStart = request.preferredDate ?? new Date();
  const booking = await createBooking({
    participantId: request.participantId,
    createdById: actorUserId,
    bookingType: request.linkedTransportRequired ? "care_transport" : "care",
    status: bookingStatusFromCareRequest(request.status),
    requestedStart: requestedStart.toISOString(),
    careLocation: request.address ?? request.suburb ?? undefined,
    accessibilitySummary: request.shareAccessibility
      ? (request.accessRequirementsSummary ?? undefined)
      : undefined,
    participantNotes: request.description,
    shareAccessibility: request.shareAccessibility,
    fundingSourceTag: request.fundingSourceId ?? undefined,
    segments: request.linkedTransportRequired
      ? [
          {
            segmentType: "outbound_transport",
            startTime: requestedStart.toISOString(),
            pickupAddress: request.address ?? undefined,
            dropoffAddress: request.address ?? undefined,
            bufferBeforeMinutes: 0,
            bufferAfterMinutes: 15,
            sortOrder: 0,
          },
          {
            segmentType: "care",
            startTime: requestedStart.toISOString(),
            pickupAddress: request.address ?? undefined,
            bufferBeforeMinutes: 0,
            bufferAfterMinutes: 0,
            sortOrder: 1,
          },
        ]
      : [
          {
            segmentType: "care",
            startTime: requestedStart.toISOString(),
            pickupAddress: request.address ?? undefined,
            bufferBeforeMinutes: 0,
            bufferAfterMinutes: 0,
            sortOrder: 0,
          },
        ],
  });

  await prisma.careRequest.update({
    where: { id: careRequestId },
    data: { bookingId: booking.id },
  });
  await syncBookingStatusForCareRequest(careRequestId, actorUserId);
  return booking;
}

export async function linkCareRequestToBooking(params: {
  careRequestId: string;
  bookingId?: string;
  actorUserId: string;
}) {
  if (!params.bookingId) {
    return ensureBookingForCareRequest(
      params.careRequestId,
      params.actorUserId,
    );
  }

  await prisma.careRequest.update({
    where: { id: params.careRequestId },
    data: { bookingId: params.bookingId },
  });
  await syncBookingStatusForCareRequest(
    params.careRequestId,
    params.actorUserId,
  );
  return prisma.booking.findUniqueOrThrow({ where: { id: params.bookingId } });
}

export async function createCareRequestWithBooking(
  data: Prisma.CareRequestUncheckedCreateInput,
  actorUserId: string,
): Promise<CareRequest> {
  const request = await prisma.careRequest.create({ data });
  await ensureBookingForCareRequest(request.id, actorUserId);
  return prisma.careRequest.findUniqueOrThrow({ where: { id: request.id } });
}
