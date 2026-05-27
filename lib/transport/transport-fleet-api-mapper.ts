import type { Prisma } from "@prisma/client";

import {
  FLEET_DRIVER_VERIFICATION_KINDS,
  FLEET_VEHICLE_VERIFICATION_KINDS,
  verificationSummary,
} from "@/lib/transport/transport-fleet-verification";

type VehicleWithRelations = Prisma.TransportVehicleGetPayload<{
  include: { features: true; verifications: true };
}>;

type DriverWithRelations = Prisma.TransportDriverGetPayload<{
  include: { verifications: true };
}>;

function mapFeature(
  features: VehicleWithRelations["features"]
): Record<string, boolean> | null {
  const f = features[0];
  if (!f) return null;
  return {
    wheelchairAccessible: f.wheelchairAccessible,
    rampAvailable: f.rampAvailable,
    liftAvailable: f.liftAvailable,
    hoistAvailable: f.hoistAvailable,
    assistanceAnimalFriendly: f.assistanceAnimalFriendly,
  };
}

export function mapFleetVehicleRecord(vehicle: VehicleWithRelations) {
  const verification = verificationSummary(
    vehicle.verifications,
    FLEET_VEHICLE_VERIFICATION_KINDS
  );
  return {
    id: vehicle.id,
    organisationId: vehicle.organisationId,
    displayName: vehicle.displayName,
    registrationNumber: vehicle.registrationNumber,
    active: vehicle.active,
    vehicleId: vehicle.vehicleId,
    features: mapFeature(vehicle.features),
    verifications: vehicle.verifications.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      notes: r.notes,
    })),
    verification,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  };
}

export function mapFleetDriverRecord(driver: DriverWithRelations) {
  const verification = verificationSummary(
    driver.verifications,
    FLEET_DRIVER_VERIFICATION_KINDS
  );
  return {
    id: driver.id,
    organisationId: driver.organisationId,
    displayName: driver.displayName,
    active: driver.active,
    userId: driver.userId,
    driverProfileId: driver.driverProfileId,
    verifications: driver.verifications.map((r) => ({
      id: r.id,
      kind: r.kind,
      status: r.status,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      notes: r.notes,
    })),
    verification,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
  };
}
