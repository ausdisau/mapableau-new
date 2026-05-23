import { prisma } from "@/lib/prisma";
import {
  matchDriverTraining,
  matchVehicleCapabilities,
} from "@/lib/transport-osm/capability-matcher";
import { listAvailableFleet } from "@/lib/transport-osm/availability-service";
import { getTravelTimeSeconds } from "@/lib/transport-osm/travel-time-matrix-service";
import type { DispatchRecommendation } from "@/types/transport-osm";
import type {
  AccessNeedsInput,
  VehicleRequirementsInput,
} from "@/types/transport-osm";

export async function getDispatchRecommendations(
  transportBookingId: string
): Promise<DispatchRecommendation[]> {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!booking?.operatorOrganisationId) return [];

  const { drivers, vehicles } = await listAvailableFleet(
    booking.operatorOrganisationId,
    booking
  );

  const vehicleReqs = (booking.vehicleRequirements ?? {}) as VehicleRequirementsInput;
  const accessNeeds = (booking.accessNeeds ?? {}) as AccessNeedsInput;
  const recommendations: DispatchRecommendation[] = [];

  for (const driver of drivers) {
    for (const vehicle of vehicles) {
      const warnings: string[] = [];
      const vehicleMatch = matchVehicleCapabilities(vehicleReqs, vehicle);
      const driverMatch = matchDriverTraining(accessNeeds, driver);
      warnings.push(...vehicleMatch.warnings, ...driverMatch.warnings);

      let score = 1;
      if (vehicleMatch.ok) score += 2;
      if (driverMatch.ok) score += 2;
      if (vehicle.wheelchairAccessible && vehicleReqs.requiresWheelchairAccessible) {
        score += 1;
      }

      let estimatedPickupMinutes = 30;
      if (
        booking.pickupLat != null &&
        booking.pickupLng != null &&
        booking.dropoffLat != null &&
        booking.dropoffLng != null
      ) {
        try {
          const sec = await getTravelTimeSeconds(
            { lat: booking.pickupLat, lng: booking.pickupLng },
            { lat: booking.dropoffLat, lng: booking.dropoffLng }
          );
          estimatedPickupMinutes = Math.ceil(sec / 60);
        } catch {
          /* use default */
        }
      }

      recommendations.push({
        driverProfileId: driver.id,
        vehicleId: vehicle.id,
        driverName: driver.displayName,
        vehicleName: vehicle.displayName,
        score,
        warnings,
        estimatedPickupMinutes,
      });
    }
  }

  return recommendations.sort((a, b) => b.score - a.score).slice(0, 20);
}
