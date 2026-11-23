import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type { ScheduleConflictResult } from "@/types/transport-scheduling";

type DbClient = Prisma.TransactionClient | typeof prisma;

/** Overlap: other start < end AND (other end > start OR other end is null/open-ended). */
function tripOverlapWhere(params: {
  tripId?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}) {
  return {
    id: params.tripId ? { not: params.tripId } : undefined,
    status: {
      notIn: ["cancelled", "declined", "closed"] as Array<
        "cancelled" | "declined" | "closed"
      >,
    },
    scheduledStart: { lt: params.scheduledEnd },
    OR: [
      { scheduledEnd: { gt: params.scheduledStart } },
      { scheduledEnd: null },
    ],
  };
}

export async function detectScheduleConflicts(
  params: {
    tripId?: string;
    driverId?: string;
    vehicleId?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  },
  tx?: Prisma.TransactionClient
): Promise<ScheduleConflictResult> {
  const db: DbClient = tx ?? prisma;
  const conflicts: ScheduleConflictResult["conflicts"] = [];
  const tripWhere = tripOverlapWhere(params);

  if (params.driverId) {
    const overlappingTrips = await db.transportDispatchAssignment.findMany({
      where: {
        active: true,
        driverId: params.driverId,
        trip: tripWhere,
      },
      include: { trip: true },
    });

    for (const a of overlappingTrips) {
      conflicts.push({
        conflictType: "driver_trip_overlap",
        details: `Driver assigned to trip ${a.tripId} at overlapping time`,
      });
    }

    const unavailable = await db.transportDriverAvailability.findFirst({
      where: {
        driverId: params.driverId,
        available: false,
        startAt: { lte: params.scheduledEnd },
        endAt: { gte: params.scheduledStart },
      },
    });
    if (unavailable) {
      conflicts.push({
        conflictType: "driver_unavailable",
        details: "Driver marked unavailable for this window",
      });
    }
  }

  if (params.vehicleId) {
    // Same open-ended end semantics as driver overlap (null scheduledEnd = open).
    const overlappingVehicle = await db.transportDispatchAssignment.findMany({
      where: {
        active: true,
        vehicleId: params.vehicleId,
        trip: tripWhere,
      },
    });
    for (const a of overlappingVehicle) {
      conflicts.push({
        conflictType: "vehicle_trip_overlap",
        details: `Vehicle assigned to trip ${a.tripId} at overlapping time`,
      });
    }
  }

  return { hasConflict: conflicts.length > 0, conflicts };
}

export async function assertNoScheduleConflict(
  params: {
    tripId?: string;
    driverId?: string;
    vehicleId?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  },
  tx?: Prisma.TransactionClient
) {
  const db: DbClient = tx ?? prisma;
  const result = await detectScheduleConflicts(params, tx);
  if (result.hasConflict) {
    await db.transportScheduleConflict.createMany({
      data: result.conflicts.map((c) => ({
        tripId: params.tripId,
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        conflictType: c.conflictType,
        details: c.details,
      })),
    });
    throw new TransportApiError("TRANSPORT_SCHEDULE_CONFLICT", undefined, result);
  }
}
