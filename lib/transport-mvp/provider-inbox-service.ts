import type { TransportMvpTripStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { recordTransportTripEvent } from "./trip-events";
import { copyAccessNeedsToTrip, ensureTripStopsFromRequest } from "./trip-request-service";

export async function listOrgTripRequests(organisationIds: string[]) {
  return prisma.transportTripRequest.findMany({
    where: {
      OR: [
        { organisationId: { in: organisationIds } },
        { organisationId: null, status: "requested" },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      participant: { select: { id: true, name: true, email: true } },
      accessNeeds: true,
      trip: true,
    },
  });
}

export async function acceptTransportTripRequest(
  requestId: string,
  organisationId: string,
  actorUserId: string
) {
  const request = await prisma.transportTripRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("NOT_FOUND");
  if (request.status !== "requested") throw new Error("INVALID_STATUS");

  await prisma.transportTripRequest.update({
    where: { id: requestId },
    data: { status: "accepted", organisationId },
  });

  const trip = await prisma.transportTrip.create({
    data: {
      requestId,
      participantId: request.participantId,
      organisationId,
      status: "accepted",
    },
  });

  await ensureTripStopsFromRequest(trip.id, requestId);
  await copyAccessNeedsToTrip(requestId, trip.id);

  await recordTransportTripEvent({
    tripId: trip.id,
    toStatus: "accepted",
    message: "Transport request accepted by provider",
    actorUserId,
    participantId: request.participantId,
    organisationId,
  });

  return prisma.transportTrip.findUnique({
    where: { id: trip.id },
    include: { request: true, stops: true, accessNeeds: true },
  });
}

export async function declineTransportTripRequest(
  requestId: string,
  organisationId: string,
  _actorUserId: string
) {
  const request = await prisma.transportTripRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("NOT_FOUND");
  if (request.status !== "requested") throw new Error("INVALID_STATUS");

  return prisma.transportTripRequest.update({
    where: { id: requestId },
    data: { status: "declined", organisationId },
  });
}

export async function listOrgTrips(organisationIds: string[]) {
  return prisma.transportTrip.findMany({
    where: { organisationId: { in: organisationIds } },
    orderBy: { createdAt: "desc" },
    include: {
      request: true,
      dispatch: { include: { driver: true, vehicle: true } },
      evidence: true,
    },
  });
}

export async function getOrgTripDetail(tripId: string, organisationIds: string[]) {
  const trip = await prisma.transportTrip.findFirst({
    where: { id: tripId, organisationId: { in: organisationIds } },
    include: {
      participant: { select: { id: true, name: true, email: true } },
      stops: { orderBy: { sequence: "asc" } },
      accessNeeds: true,
      events: { orderBy: { createdAt: "asc" } },
      dispatch: { include: { driver: true, vehicle: { include: { features: true } } } },
      evidence: true,
      request: true,
    },
  });
  if (!trip) throw new Error("NOT_FOUND");
  return trip;
}

export async function listOrgFleet(organisationId: string) {
  const [drivers, vehicles] = await Promise.all([
    prisma.transportDriver.findMany({
      where: { organisationId, active: true },
      include: { verifications: true },
    }),
    prisma.transportVehicle.findMany({
      where: { organisationId, active: true },
      include: { features: true },
    }),
  ]);
  return { drivers, vehicles };
}

export const TRIP_STATUS_ORDER: TransportMvpTripStatus[] = [
  "accepted",
  "dispatched",
  "driver_en_route",
  "arrived_pickup",
  "on_board",
  "in_transit",
  "arrived_dropoff",
  "completed",
];
