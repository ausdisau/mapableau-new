import type { TransportTrip } from "@prisma/client";

import { transportAccessibleConfig } from "@/lib/config/transport-accessible";
import { prisma } from "@/lib/prisma";

/**
 * Creates a unified Booking record when a transport trip completes, for NDIS claim workflows.
 * Human approval still required before claim submission.
 */
export async function bridgeTransportTripToBooking(
  trip: TransportTrip
): Promise<{ bookingId: string; created: boolean } | null> {
  if (!transportAccessibleConfig.bookingBridgeEnabled) {
    return null;
  }

  if (trip.status !== "trip_completed" && trip.status !== "closed") {
    return null;
  }

  const existing = await prisma.booking.findFirst({
    where: { transportTripId: trip.id },
  });
  if (existing) {
    return { bookingId: existing.id, created: false };
  }

  const booking = await prisma.booking.create({
    data: {
      participantId: trip.participantId,
      bookingType: "transport",
      status: "completed",
      requestedStart: trip.scheduledStart,
      requestedEnd: trip.scheduledEnd ?? trip.scheduledStart,
      pickupAddress: trip.pickupAddress,
      dropoffAddress: trip.dropoffAddress,
      // Trip-specific grants do not extend to readers of the general booking record.
      assignedOrganisationId: trip.providerOrganisationId,
      shareAccessibility: false,
      createdById: trip.participantId,
      transportTripId: trip.id,
    },
  });

  await prisma.bookingTimelineEvent.create({
    data: {
      bookingId: booking.id,
      eventType: "booking_created",
      title: "Transport trip linked",
      description: `Created from transport trip ${trip.id}`,
      actorUserId: trip.participantId,
    },
  });

  return { bookingId: booking.id, created: true };
}
