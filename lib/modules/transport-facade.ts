import type { TransportBooking } from "@prisma/client";

import { createBooking } from "@/lib/bookings/booking-service";
import {
  bookingStatusFromTransportBooking,
  syncBookingStatusForTransportBooking,
} from "@/lib/bookings/status-sync";
import { geocodeAddress } from "@/lib/geo/geocode";
import { upsertTransportBookingLocation } from "@/lib/geo/transport-locations";
import { prisma } from "@/lib/prisma";

export async function geocodeTransportBooking(transportBookingId: string) {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");

  const pickup =
    booking.pickupLat != null && booking.pickupLng != null
      ? { lat: booking.pickupLat, lng: booking.pickupLng }
      : await geocodeAddress(booking.pickupAddress);
  const dropoff =
    booking.dropoffLat != null && booking.dropoffLng != null
      ? { lat: booking.dropoffLat, lng: booking.dropoffLng }
      : await geocodeAddress(booking.dropoffAddress);

  const updated = await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: {
      pickupLat: pickup?.lat,
      pickupLng: pickup?.lng,
      dropoffLat: dropoff?.lat,
      dropoffLng: dropoff?.lng,
    },
  });

  await upsertTransportBookingLocation({
    transportBookingId,
    pickupLat: updated.pickupLat,
    pickupLng: updated.pickupLng,
    dropoffLat: updated.dropoffLat,
    dropoffLng: updated.dropoffLng,
  });

  return updated;
}

export async function ensureBookingForTransportBooking(
  transportBookingId: string,
  actorUserId: string,
) {
  const transport = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!transport) throw new Error("NOT_FOUND");

  if (transport.bookingId) {
    return prisma.booking.findUniqueOrThrow({
      where: { id: transport.bookingId },
    });
  }

  const booking = await createBooking({
    participantId: transport.participantId,
    createdById: actorUserId,
    bookingType: "transport",
    status: bookingStatusFromTransportBooking(transport.status),
    requestedStart: transport.pickupWindowStart.toISOString(),
    requestedEnd: transport.pickupWindowEnd?.toISOString(),
    pickupAddress: transport.pickupAddress,
    dropoffAddress: transport.dropoffAddress,
    accessibilitySummary: transport.shareAccessibility
      ? JSON.stringify(transport.mobilityAidSnapshot ?? {})
      : undefined,
    participantNotes: transport.pickupNotes ?? undefined,
    shareAccessibility: transport.shareAccessibility,
    segments: [
      {
        segmentType: "transport",
        startTime: transport.pickupWindowStart.toISOString(),
        endTime: transport.pickupWindowEnd?.toISOString(),
        pickupAddress: transport.pickupAddress,
        dropoffAddress: transport.dropoffAddress,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 0,
        sortOrder: 0,
      },
    ],
  });

  await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { bookingId: booking.id },
  });
  await syncBookingStatusForTransportBooking(transportBookingId, actorUserId);
  return booking;
}

export async function linkTransportBookingToBooking(params: {
  transportBookingId: string;
  bookingId?: string;
  actorUserId: string;
}) {
  if (!params.bookingId) {
    return ensureBookingForTransportBooking(
      params.transportBookingId,
      params.actorUserId,
    );
  }

  await prisma.transportBooking.update({
    where: { id: params.transportBookingId },
    data: { bookingId: params.bookingId },
  });
  await syncBookingStatusForTransportBooking(
    params.transportBookingId,
    params.actorUserId,
  );
  return prisma.booking.findUniqueOrThrow({ where: { id: params.bookingId } });
}

export async function finaliseTransportBookingSpine(
  transport: TransportBooking,
  actorUserId: string,
) {
  await ensureBookingForTransportBooking(transport.id, actorUserId);
  return geocodeTransportBooking(transport.id);
}
