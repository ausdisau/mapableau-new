import {
  FLEET_DRIVER_VERIFICATION_KINDS,
  FLEET_VEHICLE_VERIFICATION_KINDS,
  verificationSummary,
} from "@/lib/transport/transport-fleet-verification";
import { prisma } from "@/lib/prisma";

export async function getFleetHealthSummary(organisationId: string) {
  const [vehicles, drivers] = await Promise.all([
    prisma.transportVehicle.findMany({
      where: { organisationId },
      include: { verifications: true },
    }),
    prisma.transportDriver.findMany({
      where: { organisationId },
      include: { verifications: true },
    }),
  ]);

  const assignments = await prisma.transportDispatchAssignment.findMany({
    where: {
      active: true,
      trip: { providerOrganisationId: organisationId },
    },
    select: { vehicleId: true, driverId: true },
  });

  const vehicleTripCounts = new Map<string, number>();
  const driverTripCounts = new Map<string, number>();
  for (const row of assignments) {
    if (row.vehicleId) {
      vehicleTripCounts.set(
        row.vehicleId,
        (vehicleTripCounts.get(row.vehicleId) ?? 0) + 1
      );
    }
    if (row.driverId) {
      driverTripCounts.set(
        row.driverId,
        (driverTripCounts.get(row.driverId) ?? 0) + 1
      );
    }
  }

  const vehicleIssues = vehicles
    .map((v) => {
      const summary = verificationSummary(
        v.verifications,
        FLEET_VEHICLE_VERIFICATION_KINDS
      );
      return {
        type: "vehicle" as const,
        id: v.id,
        displayName: v.displayName,
        active: v.active,
        issues: summary.issues,
        ready: summary.ready,
        activeTripCount: vehicleTripCounts.get(v.id) ?? 0,
      };
    })
    .filter((v) => !v.ready || !v.active);

  const driverIssues = drivers
    .map((d) => {
      const summary = verificationSummary(
        d.verifications,
        FLEET_DRIVER_VERIFICATION_KINDS
      );
      return {
        type: "driver" as const,
        id: d.id,
        displayName: d.displayName,
        active: d.active,
        issues: summary.issues,
        ready: summary.ready,
        activeTripCount: driverTripCounts.get(d.id) ?? 0,
      };
    })
    .filter((d) => !d.ready || !d.active);

  return {
    vehiclesWithIssues: vehicleIssues,
    driversWithIssues: driverIssues,
    counts: {
      vehicles: vehicles.length,
      drivers: drivers.length,
      vehiclesNotReady: vehicleIssues.length,
      driversNotReady: driverIssues.length,
    },
  };
}
