import type { TransportBooking } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { transportOsmConfig } from "@/lib/transport-osm/config";
import {
  matchDriverTraining,
  matchVehicleCapabilities,
} from "@/lib/transport-osm/capability-matcher";
import {
  isDriverAvailable,
  isVehicleAvailable,
} from "@/lib/transport-osm/availability-service";
import { getTravelTimeSeconds } from "@/lib/transport-osm/travel-time-matrix-service";
import type {
  AccessNeedsInput,
  VehicleRequirementsInput,
} from "@/types/transport-osm";

export type AssignmentValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export async function validateAssignment(params: {
  booking: TransportBooking;
  driverProfileId: string;
  vehicleId: string;
}): Promise<AssignmentValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const [driver, vehicle] = await Promise.all([
    prisma.driverProfile.findUnique({ where: { id: params.driverProfileId } }),
    prisma.vehicle.findUnique({ where: { id: params.vehicleId } }),
  ]);

  if (!driver?.active) errors.push("Driver is not active.");
  if (!vehicle?.active) errors.push("Vehicle is not active.");

  const vehicleReqs = (params.booking.vehicleRequirements ?? {}) as VehicleRequirementsInput;
  const accessNeeds = (params.booking.accessNeeds ?? {}) as AccessNeedsInput;

  const vehicleMatch = matchVehicleCapabilities(vehicleReqs, vehicle);
  if (!vehicleMatch.ok) warnings.push(...vehicleMatch.warnings);

  const driverMatch = matchDriverTraining(accessNeeds, driver);
  if (!driverMatch.ok) warnings.push(...driverMatch.warnings);

  if (driver && !(await isDriverAvailable(driver.id, params.booking.pickupWindowStart))) {
    errors.push("Driver is not available in the pickup window.");
  }
  if (
    vehicle &&
    !(await isVehicleAvailable(
      vehicle.id,
      params.booking.pickupWindowStart,
      params.booking.id
    ))
  ) {
    errors.push("Vehicle is already booked for an overlapping trip.");
  }

  const pickupLat = params.booking.pickupLat;
  const pickupLng = params.booking.pickupLng;
  const dropoffLat = params.booking.dropoffLat;
  const dropoffLng = params.booking.dropoffLng;

  if (pickupLat != null && pickupLng != null && dropoffLat != null && dropoffLng != null) {
    try {
      const travelSeconds = await getTravelTimeSeconds(
        { lat: pickupLat, lng: pickupLng },
        { lat: dropoffLat, lng: dropoffLng }
      );
      const windowEnd =
        params.booking.pickupWindowEnd ?? params.booking.pickupWindowStart;
      const windowMs = windowEnd.getTime() - params.booking.pickupWindowStart.getTime();
      const neededMs =
        (travelSeconds + transportOsmConfig.boardingBufferMinutes * 60) * 1000;
      if (neededMs > windowMs + 30 * 60 * 1000) {
        warnings.push(
          "Route duration plus boarding time may exceed the pickup window."
        );
      }
    } catch {
      warnings.push("Could not verify route duration against pickup window.");
    }
  } else {
    warnings.push("Pickup or drop-off coordinates missing; route timing not verified.");
  }

  const prefs = params.booking.communicationPreferences as { notes?: string } | null;
  if (prefs?.notes) {
    warnings.push(`Participant preference: ${prefs.notes}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
