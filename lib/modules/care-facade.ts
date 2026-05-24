import type { CareRequest } from "@prisma/client";

import { ensureBookingConversation } from "@/lib/bookings/booking-conversation";
import {
  syncBookingStatusFromCareRequest,
} from "@/lib/bookings/status-sync";
import { createBooking } from "@/lib/bookings/booking-service";
import {
  assignCareRequestProvider,
  createCareRequest,
  providerAcceptCareRequest,
  submitCareRequest,
} from "@/lib/care/care-request-service";
import { createLinkedTransportFromCareRequest } from "@/lib/orchestration/care-transport-orchestrator";
import { prisma } from "@/lib/prisma";
import { recordCareRequestStatusHistory } from "@/lib/care/care-status-history";

export async function linkBookingToCareRequest(
  careRequestId: string,
  actorUserId: string,
): Promise<CareRequest> {
  const request = await prisma.careRequest.findUniqueOrThrow({
    where: { id: careRequestId },
  });

  if (request.bookingId) return request;

  const bookingType = request.linkedTransportRequired
    ? "care_transport"
    : "care";

  const start = request.preferredDate ?? new Date();
  const booking = await createBooking({
    participantId: request.participantId,
    createdById: actorUserId,
    bookingType,
    requestedStart: start.toISOString(),
    requestedEnd: request.endTime
      ? new Date(
          `${start.toISOString().slice(0, 10)}T${request.endTime}`,
        ).toISOString()
      : undefined,
    careLocation: request.address ?? undefined,
    accessibilitySummary: request.accessRequirementsSummary ?? undefined,
    shareAccessibility: request.shareAccessibility,
    assignedOrganisationId: request.assignedOrganisationId ?? undefined,
    status: "draft",
    segments: request.linkedTransportRequired
      ? [
          {
            segmentType: "care",
            startTime: start.toISOString(),
            sortOrder: 0,
            bufferBeforeMinutes: 0,
            bufferAfterMinutes: 15,
          },
          {
            segmentType: "outbound_transport",
            startTime: start.toISOString(),
            pickupAddress: request.address ?? undefined,
            dropoffAddress: request.address ?? undefined,
            sortOrder: 1,
            bufferBeforeMinutes: 0,
            bufferAfterMinutes: 0,
          },
        ]
      : undefined,
  });

  const updated = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: { bookingId: booking.id },
  });

  await ensureBookingConversation({
    bookingId: booking.id,
    participantId: request.participantId,
    createdById: actorUserId,
    title: request.title,
    organisationId: request.assignedOrganisationId,
  });

  return updated;
}

export async function submitCareRequestWithBooking(
  careRequestId: string,
  actorUserId: string,
): Promise<CareRequest> {
  await linkBookingToCareRequest(careRequestId, actorUserId);
  const request = await submitCareRequest(careRequestId, actorUserId);
  await recordCareRequestStatusHistory({
    careRequestId,
    toStatus: request.status,
    actorUserId,
  });
  await syncBookingStatusFromCareRequest(careRequestId);

  if (request.linkedTransportRequired) {
    await createLinkedTransportFromCareRequest(careRequestId, actorUserId);
  }

  const withBooking = await prisma.careRequest.findUniqueOrThrow({
    where: { id: careRequestId },
  });

  if (withBooking.bookingId) {
    await ensureBookingConversation({
      bookingId: withBooking.bookingId,
      participantId: withBooking.participantId,
      createdById: actorUserId,
      title: withBooking.title,
      organisationId: withBooking.assignedOrganisationId,
    });
  }

  return withBooking;
}

export async function acceptCareRequestWithSync(
  careRequestId: string,
  actorUserId: string,
): Promise<CareRequest> {
  const request = await providerAcceptCareRequest(careRequestId, actorUserId);
  await recordCareRequestStatusHistory({
    careRequestId,
    toStatus: request.status,
    actorUserId,
  });
  await syncBookingStatusFromCareRequest(careRequestId);

  if (request.linkedTransportRequired) {
    const orch = await prisma.orchestrationEvent.findFirst({
      where: {
        careRequestId,
        eventType: "care_transport_link_created",
      },
    });
    if (orch?.transportBookingId) {
      await prisma.transportBooking.update({
        where: { id: orch.transportBookingId },
        data: { status: "requested" },
      });
      const tb = await prisma.transportBooking.findUnique({
        where: { id: orch.transportBookingId },
      });
      if (tb?.bookingId) {
        await syncBookingStatusFromCareRequest(careRequestId);
      }
    }
  }

  return request;
}

export { assignCareRequestProvider, createCareRequest };
