import { checkDriverEligibility, checkVehicleEligibility } from "@/lib/transport/transport-eligibility-service";
import {
  FLEET_DRIVER_VERIFICATION_KINDS,
  FLEET_VEHICLE_VERIFICATION_KINDS,
  verificationSummary,
} from "@/lib/transport/transport-fleet-verification";
import { prisma } from "@/lib/prisma";

function mapFeature(feature: {
  wheelchairAccessible: boolean;
  rampAvailable: boolean;
  liftAvailable: boolean;
  hoistAvailable: boolean;
  assistanceAnimalFriendly: boolean;
} | null) {
  if (!feature) return null;
  return {
    wheelchairAccessible: feature.wheelchairAccessible,
    rampAvailable: feature.rampAvailable,
    liftAvailable: feature.liftAvailable,
    hoistAvailable: feature.hoistAvailable,
    assistanceAnimalFriendly: feature.assistanceAnimalFriendly,
  };
}

export async function listFleetVehicles(organisationId: string) {
  const vehicles = await prisma.transportVehicle.findMany({
    where: { organisationId },
    include: { features: true, verifications: true },
    orderBy: { displayName: "asc" },
  });

  return Promise.all(
    vehicles.map(async (v) => {
      const eligibility = await checkVehicleEligibility(v.id, {});
      const verification = verificationSummary(
        v.verifications,
        FLEET_VEHICLE_VERIFICATION_KINDS
      );
      return {
        id: v.id,
        displayName: v.displayName,
        registrationNumber: v.registrationNumber,
        active: v.active,
        vehicleId: v.vehicleId,
        features: mapFeature(v.features[0] ?? null),
        verification,
        dispatchReady: v.active && eligibility.eligible,
        eligibilityReasons: eligibility.reasons,
        createdAt: v.createdAt.toISOString(),
      };
    })
  );
}

export async function getFleetVehicle(organisationId: string, vehicleId: string) {
  const v = await prisma.transportVehicle.findFirst({
    where: { id: vehicleId, organisationId },
    include: { features: true, verifications: true },
  });
  if (!v) return null;

  const eligibility = await checkVehicleEligibility(v.id, {});
  const verification = verificationSummary(
    v.verifications,
    FLEET_VEHICLE_VERIFICATION_KINDS
  );

  const activeAssignments = await prisma.transportDispatchAssignment.count({
    where: { vehicleId, active: true },
  });

  return {
    id: v.id,
    displayName: v.displayName,
    registrationNumber: v.registrationNumber,
    active: v.active,
    vehicleId: v.vehicleId,
    features: mapFeature(v.features[0] ?? null),
    verifications: v.verifications.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      notes: r.notes,
    })),
    verification,
    dispatchReady: v.active && eligibility.eligible,
    eligibilityReasons: eligibility.reasons,
    activeAssignmentCount: activeAssignments,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}

export async function listFleetDrivers(organisationId: string) {
  const drivers = await prisma.transportDriver.findMany({
    where: { organisationId },
    include: { verifications: true },
    orderBy: { displayName: "asc" },
  });

  return Promise.all(
    drivers.map(async (d) => {
      const eligibility = await checkDriverEligibility(d.id);
      const verification = verificationSummary(
        d.verifications,
        FLEET_DRIVER_VERIFICATION_KINDS
      );
      return {
        id: d.id,
        displayName: d.displayName,
        active: d.active,
        userId: d.userId,
        driverProfileId: d.driverProfileId,
        verification,
        dispatchReady: d.active && eligibility.eligible,
        eligibilityReasons: eligibility.reasons,
        createdAt: d.createdAt.toISOString(),
      };
    })
  );
}

export async function getFleetDriver(organisationId: string, driverId: string) {
  const d = await prisma.transportDriver.findFirst({
    where: { id: driverId, organisationId },
    include: { verifications: true },
  });
  if (!d) return null;

  const eligibility = await checkDriverEligibility(d.id);
  const verification = verificationSummary(
    d.verifications,
    FLEET_DRIVER_VERIFICATION_KINDS
  );

  const activeAssignments = await prisma.transportDispatchAssignment.count({
    where: { driverId, active: true },
  });

  return {
    id: d.id,
    displayName: d.displayName,
    active: d.active,
    userId: d.userId,
    driverProfileId: d.driverProfileId,
    verifications: d.verifications.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      notes: r.notes,
    })),
    verification,
    dispatchReady: d.active && eligibility.eligible,
    eligibilityReasons: eligibility.reasons,
    activeAssignmentCount: activeAssignments,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export async function listLegacyVehiclesForLink(organisationId: string) {
  return prisma.vehicle.findMany({
    where: { organisationId, active: true },
    select: { id: true, displayName: true, registrationNumber: true },
    orderBy: { displayName: "asc" },
  });
}
