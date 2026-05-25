import { prisma } from "@/lib/prisma";

import { recordTransportTripEvent } from "./trip-events";

export async function confirmTransportTrip(
  tripId: string,
  participantId: string
) {
  const trip = await prisma.transportTrip.findFirst({
    where: { id: tripId, participantId },
  });
  if (!trip) throw new Error("NOT_FOUND");
  if (trip.status !== "completed" && trip.status !== "arrived_dropoff") {
    throw new Error("INVALID_STATUS");
  }

  const fromStatus = trip.status;
  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: {
      status: "completed",
      participantConfirmedAt: new Date(),
      participantDisputedAt: null,
      disputeReason: null,
    },
  });

  await recordTransportTripEvent({
    tripId,
    fromStatus,
    toStatus: "completed",
    message: "Participant confirmed trip",
    actorUserId: participantId,
    participantId,
    organisationId: trip.organisationId,
  });

  return updated;
}

export async function disputeTransportTrip(
  tripId: string,
  participantId: string,
  reason: string
) {
  const trip = await prisma.transportTrip.findFirst({
    where: { id: tripId, participantId },
  });
  if (!trip) throw new Error("NOT_FOUND");

  const fromStatus = trip.status;
  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: {
      status: "disputed",
      participantDisputedAt: new Date(),
      disputeReason: reason,
    },
  });

  await recordTransportTripEvent({
    tripId,
    fromStatus,
    toStatus: "disputed",
    message: reason,
    actorUserId: participantId,
    participantId,
    organisationId: trip.organisationId,
  });

  return updated;
}
