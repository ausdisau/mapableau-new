import type { DriverProfile, Vehicle } from "@prisma/client";

import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

import type {
  AccessNeedsInput,
  VehicleRequirementsInput,
} from "@/types/transport-osm";

export function matchVehicleCapabilities(
  requirements: VehicleRequirementsInput,
  vehicle: Pick<
    Vehicle,
    | "wheelchairAccessible"
    | "rampAvailable"
    | "liftAvailable"
    | "assistanceAnimalFriendly"
    | "seatedCapacity"
    | "wheelchairSpaces"
  > | null
): { ok: boolean; warnings: string[] } {
  const warnings = getVehicleSuitabilityWarnings(requirements, vehicle);
  const capacityMin = requirements.seatedCapacityMin ?? 1;
  if (vehicle && vehicle.seatedCapacity < capacityMin) {
    warnings.push(`Vehicle seated capacity (${vehicle.seatedCapacity}) below required (${capacityMin}).`);
  }
  return { ok: warnings.length === 0, warnings };
}

export function matchDriverTraining(
  accessNeeds: AccessNeedsInput,
  driver: Pick<DriverProfile, "accessibilityTrainingStatus" | "driverCapabilities"> | null
): { ok: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (!driver) {
    warnings.push("No driver assigned.");
    return { ok: false, warnings };
  }
  const caps = new Set(driver.driverCapabilities ?? []);
  if (accessNeeds.hoistRequired && !caps.has("hoist")) {
    warnings.push("Driver not trained for hoist transfers.");
  }
  if (accessNeeds.boardingAssistance && !caps.has("wheelchair_assist")) {
    if (driver.accessibilityTrainingStatus !== "verified") {
      warnings.push("Driver accessibility training not verified for boarding assistance.");
    }
  }
  if (accessNeeds.transferAssistance && !caps.has("companion_support") && !caps.has("wheelchair_assist")) {
    warnings.push("Driver may not have transfer assistance capability.");
  }
  return { ok: warnings.length === 0, warnings };
}
