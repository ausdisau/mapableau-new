import { prisma } from "@/lib/prisma";

import { recordTransportTripEvent } from "./trip-events";

export async function recordTripEvidence(params: {
  tripId: string;
  startedAt: Date;
  completedAt: Date;
  distanceKm: number;
  notes?: string;
  recordedById: string;
}) {
  if (params.completedAt <= params.startedAt) {
    throw new Error("INVALID_EVIDENCE_TIMES");
  }
  if (params.distanceKm <= 0) {
    throw new Error("INVALID_DISTANCE");
  }

  const trip = await prisma.transportTrip.findUnique({ where: { id: params.tripId } });
  if (!trip) throw new Error("NOT_FOUND");

  const evidence = await prisma.transportTripEvidence.upsert({
    where: { tripId: params.tripId },
    create: {
      tripId: params.tripId,
      startedAt: params.startedAt,
      completedAt: params.completedAt,
      distanceKm: params.distanceKm,
      notes: params.notes,
      recordedById: params.recordedById,
    },
    update: {
      startedAt: params.startedAt,
      completedAt: params.completedAt,
      distanceKm: params.distanceKm,
      notes: params.notes,
      recordedById: params.recordedById,
    },
  });

  await recordTransportTripEvent({
    tripId: params.tripId,
    fromStatus: trip.status,
    toStatus: trip.status,
    message: `Trip evidence recorded: ${params.distanceKm} km`,
    actorUserId: params.recordedById,
    participantId: trip.participantId,
    organisationId: trip.organisationId,
  });

  return evidence;
}

export async function assertTripHasEvidence(tripId: string) {
  const evidence = await prisma.transportTripEvidence.findUnique({
    where: { tripId },
  });
  if (!evidence) throw new Error("EVIDENCE_REQUIRED");
}
