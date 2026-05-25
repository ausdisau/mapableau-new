import type { TransportMvpTripStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { assertTripHasEvidence } from "./trip-evidence-service";
import { recordTransportTripEvent } from "./trip-events";

const DRIVER_STATUSES: TransportMvpTripStatus[] = [
  "driver_en_route",
  "arrived_pickup",
  "on_board",
  "in_transit",
  "arrived_dropoff",
  "completed",
];

export async function updateTransportTripStatus(
  tripId: string,
  status: TransportMvpTripStatus,
  actorUserId: string,
  message?: string
) {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    include: { dispatch: true },
  });
  if (!trip) throw new Error("NOT_FOUND");
  if (!trip.dispatch) throw new Error("NOT_DISPATCHED");

  if (status === "completed") {
    await assertTripHasEvidence(tripId);
  }

  if (!DRIVER_STATUSES.includes(status) && status !== "cancelled") {
    throw new Error("INVALID_STATUS");
  }

  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status },
  });

  await recordTransportTripEvent({
    tripId,
    fromStatus: trip.status,
    toStatus: status,
    message,
    actorUserId,
    participantId: trip.participantId,
    organisationId: trip.organisationId,
  });

  return updated;
}

export function plainLanguageMvpStatus(status: TransportMvpTripStatus): string {
  const labels: Record<TransportMvpTripStatus, string> = {
    requested: "Requested",
    accepted: "Accepted by provider",
    dispatched: "Driver and vehicle assigned",
    driver_en_route: "Driver en route to pickup",
    arrived_pickup: "Arrived for pickup",
    on_board: "Participant on board",
    in_transit: "In transit",
    arrived_dropoff: "Arrived at destination",
    completed: "Trip completed",
    cancelled: "Cancelled",
    disputed: "Disputed by participant",
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

export const MVP_STATUS_STEPPER: TransportMvpTripStatus[] = [
  "accepted",
  "dispatched",
  "driver_en_route",
  "arrived_pickup",
  "on_board",
  "in_transit",
  "arrived_dropoff",
  "completed",
];
