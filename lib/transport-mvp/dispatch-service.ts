import type { TransportMvpVerificationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

import { recordTransportTripEvent } from "./trip-events";

const VERIFIED: TransportMvpVerificationStatus[] = ["verified"];

export function isDriverEligible(
  driver: {
    verificationStatus: TransportMvpVerificationStatus;
    active: boolean;
    verifications?: {
      licenceStatus: TransportMvpVerificationStatus;
      screeningStatus: TransportMvpVerificationStatus;
    }[];
  } | null
): { ok: boolean; reason?: string } {
  if (!driver) return { ok: false, reason: "Driver not found." };
  if (!driver.active) return { ok: false, reason: "Driver is inactive." };
  if (!VERIFIED.includes(driver.verificationStatus)) {
    return { ok: false, reason: "Driver verification is not complete." };
  }
  const verification = driver.verifications?.[0];
  if (verification?.licenceStatus && !VERIFIED.includes(verification.licenceStatus)) {
    return { ok: false, reason: "Driver licence not verified." };
  }
  if (verification?.screeningStatus && !VERIFIED.includes(verification.screeningStatus)) {
    return { ok: false, reason: "Driver screening not verified." };
  }
  return { ok: true };
}

export function isVehicleEligible(
  vehicle: {
    verificationStatus: TransportMvpVerificationStatus;
    active: boolean;
  } | null
): { ok: boolean; reason?: string } {
  if (!vehicle) return { ok: false, reason: "Vehicle not found." };
  if (!vehicle.active) return { ok: false, reason: "Vehicle is inactive." };
  if (!VERIFIED.includes(vehicle.verificationStatus)) {
    return { ok: false, reason: "Vehicle verification is not complete." };
  }
  return { ok: true };
}

export async function assignDispatch(
  tripId: string,
  driverId: string,
  vehicleId: string,
  assignedById: string,
  options?: { allowSuitabilityOverride?: boolean }
) {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    include: { accessNeeds: true },
  });
  if (!trip) throw new Error("NOT_FOUND");

  const driver = await prisma.transportDriver.findFirst({
    where: { id: driverId, organisationId: trip.organisationId },
    include: { verifications: true },
  });
  const vehicle = await prisma.transportVehicle.findFirst({
    where: { id: vehicleId, organisationId: trip.organisationId },
    include: { features: true },
  });

  const driverCheck = isDriverEligible(driver);
  if (!driverCheck.ok) throw new Error(driverCheck.reason ?? "DRIVER_INELIGIBLE");

  const vehicleCheck = isVehicleEligible(vehicle);
  if (!vehicleCheck.ok) throw new Error(vehicleCheck.reason ?? "VEHICLE_INELIGIBLE");

  const suitabilityWarnings = getVehicleSuitabilityWarnings(
    {
      requiresWheelchairAccessible: trip.accessNeeds?.wheelchairRequired,
      requiresRamp: trip.accessNeeds?.assistedPickup,
      requiresLift: false,
      assistanceAnimal: false,
    },
    vehicle?.features
      ? {
          wheelchairAccessible: vehicle.features.wheelchairAccessible,
          rampAvailable: vehicle.features.rampAvailable,
          liftAvailable: vehicle.features.liftAvailable,
          assistanceAnimalFriendly: vehicle.features.assistanceAnimalFriendly,
        }
      : null
  );

  if (suitabilityWarnings.length > 0 && !options?.allowSuitabilityOverride) {
    throw new Error(`SUITABILITY:${suitabilityWarnings.join(" ")}`);
  }

  const assignment = await prisma.transportDispatchAssignment.upsert({
    where: { tripId },
    create: {
      tripId,
      driverId,
      vehicleId,
      assignedById,
      eligibilitySnapshot: {
        driverVerified: true,
        vehicleVerified: true,
        suitabilityWarnings,
        override: options?.allowSuitabilityOverride ?? false,
      },
    },
    update: {
      driverId,
      vehicleId,
      assignedById,
      eligibilitySnapshot: {
        driverVerified: true,
        vehicleVerified: true,
        suitabilityWarnings,
        override: options?.allowSuitabilityOverride ?? false,
      },
    },
  });

  const updated = await prisma.transportTrip.update({
    where: { id: tripId },
    data: { status: "dispatched" },
  });

  await recordTransportTripEvent({
    tripId,
    fromStatus: trip.status,
    toStatus: "dispatched",
    message: "Driver and vehicle assigned",
    actorUserId: assignedById,
    participantId: trip.participantId,
    organisationId: trip.organisationId,
  });

  return { trip: updated, assignment };
}
