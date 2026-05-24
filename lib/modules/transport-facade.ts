import type { TransportBooking } from "@prisma/client";

import { ensureBookingConversation } from "@/lib/bookings/booking-conversation";
import { createBooking } from "@/lib/bookings/booking-service";
import { syncBookingStatusFromTransport } from "@/lib/bookings/status-sync";
import { geocodeAddress } from "@/lib/geo/geocode";
import { persistTransportCoordinates } from "@/lib/geo/postgis";
import { prisma } from "@/lib/prisma";
import {
  acceptTransportBooking,
  createTransportBooking,
} from "@/lib/transport/transport-booking-service";
import { recordTransportStatusHistory } from "@/lib/transport/transport-status-history";

export async function linkBookingToTransport(
  transportBookingId: string,
  actorUserId: string,
): Promise<TransportBooking> {
  const tb = await prisma.transportBooking.findUniqueOrThrow({
    where: { id: transportBookingId },
  });

  if (tb.bookingId) return tb;

  const booking = await createBooking({
    participantId: tb.participantId,
    createdById: actorUserId,
    bookingType: tb.careRequestId ? "care_transport" : "transport",
    requestedStart: tb.pickupWindowStart.toISOString(),
    requestedEnd: tb.pickupWindowEnd?.toISOString(),
    pickupAddress: tb.pickupAddress,
    dropoffAddress: tb.dropoffAddress,
    shareAccessibility: tb.shareAccessibility,
    assignedOrganisationId: tb.operatorOrganisationId ?? undefined,
    status: "draft",
  });

  const updated = await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { bookingId: booking.id },
  });

  await ensureBookingConversation({
    bookingId: booking.id,
    participantId: tb.participantId,
    createdById: actorUserId,
    title: `Transport: ${tb.pickupAddress} → ${tb.dropoffAddress}`,
    organisationId: tb.operatorOrganisationId,
  });

  return updated;
}

export async function geocodeTransportBooking(
  transportBookingId: string,
): Promise<TransportBooking> {
  const tb = await prisma.transportBooking.findUniqueOrThrow({
    where: { id: transportBookingId },
  });

  const pickup = await geocodeAddress(tb.pickupAddress);
  const dropoff = await geocodeAddress(tb.dropoffAddress);

  await persistTransportCoordinates(transportBookingId, {
    pickup: pickup ? { lat: pickup.lat, lng: pickup.lng } : null,
    dropoff: dropoff ? { lat: dropoff.lat, lng: dropoff.lng } : null,
  });

  return prisma.transportBooking.findUniqueOrThrow({
    where: { id: transportBookingId },
  });
}

export async function submitTransportWithBooking(
  transportBookingId: string,
  actorUserId: string,
): Promise<TransportBooking> {
  await linkBookingToTransport(transportBookingId, actorUserId);
  await geocodeTransportBooking(transportBookingId).catch(() => undefined);

  const from = await prisma.transportBooking.findUniqueOrThrow({
    where: { id: transportBookingId },
  });

  const tb = await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { status: "requested" },
  });

  await recordTransportStatusHistory({
    transportBookingId,
    fromStatus: from.status,
    toStatus: tb.status,
    actorUserId,
  });
  await syncBookingStatusFromTransport(transportBookingId);

  if (tb.bookingId) {
    await prisma.booking.update({
      where: { id: tb.bookingId },
      data: { status: "requested" },
    });
    await ensureBookingConversation({
      bookingId: tb.bookingId,
      participantId: tb.participantId,
      createdById: actorUserId,
      title: `Transport: ${tb.pickupAddress} → ${tb.dropoffAddress}`,
      organisationId: tb.operatorOrganisationId,
    });
  }

  return tb;
}

export async function completeTransportWithSync(
  transportBookingId: string,
  actorUserId: string,
): Promise<TransportBooking> {
  const from = await prisma.transportBooking.findUniqueOrThrow({
    where: { id: transportBookingId },
  });

  const tb = await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { status: "completed" },
  });

  await recordTransportStatusHistory({
    transportBookingId,
    fromStatus: from.status,
    toStatus: tb.status,
    actorUserId,
  });
  await syncBookingStatusFromTransport(transportBookingId);

  try {
    const { createInvoiceFromCompletedTransport } = await import(
      "@/lib/orchestration/transport-invoice-orchestrator"
    );
    await createInvoiceFromCompletedTransport(transportBookingId, actorUserId);
  } catch {
    // Invoice optional when orchestration or org missing
  }

  return tb;
}

export { acceptTransportBooking, createTransportBooking };
