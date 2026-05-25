import { distanceKm } from "@/lib/geo";
import { geocodeTransportBooking } from "@/lib/modules/transport-facade";
import { prisma } from "@/lib/prisma";

export type DynamicRouteEstimate = {
  distanceKm: number;
  durationMinutes: number;
  source: "coordinates" | "geocode" | "placeholder";
};

const AVERAGE_SPEED_KMH = 35;

export function estimateRouteFromCoordinates(params: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  source?: DynamicRouteEstimate["source"];
}): DynamicRouteEstimate {
  const km = distanceKm(
    params.pickupLat,
    params.pickupLng,
    params.dropoffLat,
    params.dropoffLng,
  );
  return {
    distanceKm: km,
    durationMinutes: Math.max(5, Math.round((km / AVERAGE_SPEED_KMH) * 60)),
    source: params.source ?? "coordinates",
  };
}

export function placeholderRouteEstimate(): DynamicRouteEstimate {
  return { distanceKm: 12, durationMinutes: 30, source: "placeholder" };
}

export async function computeDynamicRouteEstimate(
  transportBookingId: string,
): Promise<DynamicRouteEstimate> {
  let booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");

  if (
    booking.pickupLat == null ||
    booking.pickupLng == null ||
    booking.dropoffLat == null ||
    booking.dropoffLng == null
  ) {
    booking = await geocodeTransportBooking(transportBookingId);
  }

  if (
    booking.pickupLat == null ||
    booking.pickupLng == null ||
    booking.dropoffLat == null ||
    booking.dropoffLng == null
  ) {
    return placeholderRouteEstimate();
  }

  return estimateRouteFromCoordinates({
    pickupLat: booking.pickupLat,
    pickupLng: booking.pickupLng,
    dropoffLat: booking.dropoffLat,
    dropoffLng: booking.dropoffLng,
    source: "geocode",
  });
}
