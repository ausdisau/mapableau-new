import { distanceKm } from "@/lib/geo";
import { prisma } from "@/lib/prisma";
import { nominatimForwardGeocode } from "@/lib/routing/nominatim-forward-geocode";

export type RouteCoordinate = {
  lat: number;
  lng: number;
  label?: string;
};

export type DynamicRouteEstimate = {
  distanceKm: number;
  durationMinutes: number;
  source: "coordinates" | "geocode" | "placeholder";
};

const AVERAGE_SPEED_KMH = 35;

/** Geocode a single address for routing (server-side). */
export async function geocodeAddressForRouting(
  address: string,
): Promise<RouteCoordinate | null> {
  const geo = await nominatimForwardGeocode(address);
  if (!geo) return null;
  return { lat: geo.lat, lng: geo.lng, label: geo.label };
}

export function estimateRouteFromCoordinates(
  pickup: RouteCoordinate,
  dropoff: RouteCoordinate,
): DynamicRouteEstimate {
  const km = distanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const durationMinutes = Math.max(
    5,
    Math.round((km / AVERAGE_SPEED_KMH) * 60),
  );
  return {
    distanceKm: km,
    durationMinutes,
    source: "coordinates",
  };
}

export function placeholderRouteEstimate(): DynamicRouteEstimate {
  return {
    distanceKm: 12,
    durationMinutes: 30,
    source: "placeholder",
  };
}

/** Resolve pickup/dropoff coordinates; persist on booking when geocoded. */
export async function resolveTransportBookingCoordinates(
  transportBookingId: string,
): Promise<{ pickup: RouteCoordinate; dropoff: RouteCoordinate } | null> {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!booking) return null;

  let pickupLat = booking.pickupLat;
  let pickupLng = booking.pickupLng;
  let dropoffLat = booking.dropoffLat;
  let dropoffLng = booking.dropoffLng;

  if (pickupLat == null || pickupLng == null) {
    const geo = await geocodeAddressForRouting(booking.pickupAddress);
    if (geo) {
      pickupLat = geo.lat;
      pickupLng = geo.lng;
    }
  }
  if (dropoffLat == null || dropoffLng == null) {
    const geo = await geocodeAddressForRouting(booking.dropoffAddress);
    if (geo) {
      dropoffLat = geo.lat;
      dropoffLng = geo.lng;
    }
  }

  if (
    pickupLat == null ||
    pickupLng == null ||
    dropoffLat == null ||
    dropoffLng == null
  ) {
    return null;
  }

  await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: {
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
    },
  });

  return {
    pickup: {
      lat: pickupLat,
      lng: pickupLng,
      label: booking.pickupAddress,
    },
    dropoff: {
      lat: dropoffLat,
      lng: dropoffLng,
      label: booking.dropoffAddress,
    },
  };
}

export async function computeDynamicRouteEstimate(
  transportBookingId: string,
): Promise<DynamicRouteEstimate> {
  const coords = await resolveTransportBookingCoordinates(transportBookingId);
  if (!coords) return placeholderRouteEstimate();
  const estimate = estimateRouteFromCoordinates(coords.pickup, coords.dropoff);
  if (coords.pickup.label || coords.dropoff.label) {
    return { ...estimate, source: "geocode" };
  }
  return estimate;
}
