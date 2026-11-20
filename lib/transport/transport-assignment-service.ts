import type { Prisma } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  assertAssignedDriver,
  assertProviderOrgTrip,
} from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import {
  assertDriverEligible,
  assertVehicleEligible,
} from "@/lib/transport/transport-eligibility-service";
import {
  countTripAssignmentRevisions,
  recordTripEvent,
} from "@/lib/transport/transport-event-service";
import { buildTripResponse } from "@/lib/transport/transport-response";
import { assertNoScheduleConflict } from "@/lib/transport/transport-schedule-conflict-service";
import { assertStatusTransition } from "@/lib/transport/transport-status-service";

function tripEnd(trip: { scheduledStart: Date; scheduledEnd: Date | null }) {
  return trip.scheduledEnd ?? new Date(trip.scheduledStart.getTime() + 3600000);
}

async function lockTripDriverVehicle(
  tx: Prisma.TransactionClient,
  tripId: string,
  driverId: string,
  vehicleId: string
) {
  // Row locks prevent concurrent assign of the same resources (Postgres).
  await tx.$queryRaw`
    SELECT id FROM transport_trips WHERE id = ${tripId} FOR UPDATE
  `;
  await tx.$queryRaw`
    SELECT id FROM transport_drivers WHERE id = ${driverId} FOR UPDATE
  `;
  await tx.$queryRaw`
    SELECT id FROM transport_vehicles WHERE id = ${vehicleId} FOR UPDATE
  `;
}

export async function assignDriverAndVehicle(
  user: CurrentUser,
  tripId: string,
  orgId: string,
  driverId: string,
  vehicleId: string,
  options?: { idempotencyKey?: string }
) {
  await assertProviderOrgTrip(user, orgId);

  return prisma.$transaction(async (tx) => {
    await lockTripDriverVehicle(tx, tripId, driverId, vehicleId);

    const trip = await tx.transportTrip.findUnique({ where: { id: tripId } });
    if (!trip || trip.providerOrganisationId !== orgId) {
      throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
    }

    if (options?.idempotencyKey) {
      const prior = await tx.transportTripEvent.findFirst({
        where: {
          tripId,
          eventType: "assigned",
          metadata: {
            path: ["idempotencyKey"],
            equals: options.idempotencyKey,
          },
        },
        orderBy: { createdAt: "desc" },
      });
      if (prior) {
        const meta = (prior.metadata ?? {}) as Record<string, unknown>;
        if (meta.driverId === driverId && meta.vehicleId === vehicleId) {
          const current = await tx.transportTrip.findUniqueOrThrow({
            where: { id: tripId },
          });
          return buildTripResponse({ trip: current, user });
        }
        throw new TransportApiError(
          "TRANSPORT_VALIDATION_FAILED",
          "Idempotency key reused with different driver/vehicle."
        );
      }
    }

    const assignable = new Set([
      "requested",
      "quote_pending",
      "quoted",
      "accepted",
      "dispatch_pending",
      "driver_vehicle_assigned",
    ]);
    if (!assignable.has(trip.status)) {
      throw new TransportApiError(
        "TRANSPORT_INVALID_STATUS_TRANSITION",
        `Cannot assign in status ${trip.status}`
      );
    }

    const driver = await tx.transportDriver.findFirst({
      where: { id: driverId, organisationId: orgId, active: true },
    });
    const vehicle = await tx.transportVehicle.findFirst({
      where: { id: vehicleId, organisationId: orgId, active: true },
    });
    if (!driver || !vehicle) {
      throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
    }

    const mobility = (trip.mobilityRequirements as Record<string, unknown>) ?? {};
    // Eligibility re-checked inside the locked transaction (expiry-aware fail-closed).
    await assertDriverEligible(driverId, mobility);
    await assertVehicleEligible(vehicleId, mobility);

    const end = tripEnd(trip);
    await assertNoScheduleConflict(
      {
        tripId,
        driverId,
        vehicleId,
        scheduledStart: trip.scheduledStart,
        scheduledEnd: end,
      },
      tx
    );

    await tx.transportDispatchAssignment.updateMany({
      where: { tripId, active: true },
      data: { active: false, unassignedAt: new Date() },
    });

    await tx.transportDispatchAssignment.create({
      data: {
        tripId,
        organisationId: orgId,
        driverId,
        vehicleId,
        assignedByUserId: user.id,
        active: true,
      },
    });

    const nextStatus = "driver_vehicle_assigned" as const;
    if (trip.status !== nextStatus) {
      assertStatusTransition(trip.status, nextStatus);
    }

    const updated = await tx.transportTrip.update({
      where: { id: tripId },
      data: { status: nextStatus },
    });

    const priorRevisions = await countTripAssignmentRevisions(tripId, tx);
    const roomGrantGeneration = priorRevisions + 1;

    await recordTripEvent({
      tripId,
      actorUserId: user.id,
      eventType: "assigned",
      fromStatus: trip.status,
      toStatus: nextStatus,
      metadata: {
        driverId,
        vehicleId,
        idempotencyKey: options?.idempotencyKey,
        aggregateVersion: roomGrantGeneration,
        roomGrantGeneration,
        // Revoke prior socket room grants — clients must re-mint after reassignment.
        revokePriorRoomGrants: true,
      },
      organisationId: orgId,
      participantId: trip.participantId,
      tx,
    });

    return buildTripResponse({ trip: updated, user });
  });
}

export async function unassignTrip(user: CurrentUser, tripId: string, orgId: string) {
  await assertProviderOrgTrip(user, orgId);

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM transport_trips WHERE id = ${tripId} FOR UPDATE
    `;

    const trip = await tx.transportTrip.findUnique({ where: { id: tripId } });
    if (!trip || trip.providerOrganisationId !== orgId) {
      throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
    }

    const active = await tx.transportDispatchAssignment.findFirst({
      where: { tripId, active: true },
    });

    await tx.transportDispatchAssignment.updateMany({
      where: { tripId, active: true },
      data: { active: false, unassignedAt: new Date() },
    });

    const updated = await tx.transportTrip.update({
      where: { id: tripId },
      data: { status: "dispatch_pending" },
    });

    const priorRevisions = await countTripAssignmentRevisions(tripId, tx);
    const roomGrantGeneration = priorRevisions + 1;

    await recordTripEvent({
      tripId,
      actorUserId: user.id,
      eventType: "unassigned",
      fromStatus: trip.status,
      toStatus: "dispatch_pending",
      metadata: {
        previousDriverId: active?.driverId,
        previousVehicleId: active?.vehicleId,
        aggregateVersion: roomGrantGeneration,
        roomGrantGeneration,
        revokePriorRoomGrants: true,
      },
      organisationId: orgId,
      participantId: trip.participantId,
      tx,
    });

    return buildTripResponse({ trip: updated, user });
  });
}

export async function driverAcceptTrip(user: CurrentUser, tripId: string) {
  const driver = await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  assertStatusTransition(trip.status, "driver_accepted");
  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status: "driver_accepted" },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "driver_accepted",
    fromStatus: trip.status,
    toStatus: "driver_accepted",
    metadata: { driverId: driver.id },
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return buildTripResponse({ trip: updated, user });
}

export async function driverRejectTrip(
  user: CurrentUser,
  tripId: string,
  reason?: string
) {
  await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.transportDispatchAssignment.updateMany({
      where: { tripId, active: true },
      data: { active: false, unassignedAt: new Date() },
    });

    await tx.transportTrip.update({
      where: { id: tripId },
      data: { status: "dispatch_pending" },
    });

    const priorRevisions = await countTripAssignmentRevisions(tripId, tx);
    await recordTripEvent({
      tripId,
      actorUserId: user.id,
      eventType: "driver_rejected",
      fromStatus: trip.status,
      toStatus: "dispatch_pending",
      message: reason,
      metadata: {
        revokePriorRoomGrants: true,
        roomGrantGeneration: priorRevisions + 1,
      },
      participantId: trip.participantId,
      tx,
    });
  });

  const updated = await prisma.transportTrip.findUniqueOrThrow({
    where: { id: tripId },
  });
  return buildTripResponse({ trip: updated, user });
}

export async function driverUpdateTripStatus(
  user: CurrentUser,
  tripId: string,
  status: import("@prisma/client").TransportTripStatus,
  message?: string
) {
  await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  assertStatusTransition(trip.status, status, { driverOnly: true });

  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "driver_status",
    fromStatus: trip.status,
    toStatus: status,
    message,
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return buildTripResponse({ trip: updated, user });
}

export async function recordDriverLocation(
  user: CurrentUser,
  tripId: string,
  lat: number,
  lng: number
) {
  const driver = await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  const activeStatuses = [
    "en_route_to_pickup",
    "arrived_at_pickup",
    "participant_boarded",
    "en_route_to_dropoff",
    "arrived_at_dropoff",
  ];
  if (!activeStatuses.includes(trip.status)) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }

  await prisma.transportLiveLocation.create({
    data: { tripId, driverId: driver.id, lat, lng },
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "location_update",
    metadata: { lat, lng },
    participantId: trip.participantId,
  });

  return { ok: true };
}

export async function getDriverTrips(user: CurrentUser) {
  const driver = await prisma.transportDriver.findFirst({
    where: { userId: user.id, active: true },
  });
  if (!driver) return [];

  const assignments = await prisma.transportDispatchAssignment.findMany({
    where: { driverId: driver.id, active: true },
    include: { trip: true },
  });

  return Promise.all(
    assignments.map((a) => buildTripResponse({ trip: a.trip, user }))
  );
}

export async function getDriverTrip(user: CurrentUser, tripId: string) {
  await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  return buildTripResponse({ trip, user });
}
