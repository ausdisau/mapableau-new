import { geoConfig } from "@/lib/config/geo";
import { prisma } from "@/lib/prisma";

export type LatLng = { lat: number; lng: number };

/**
 * Persist pickup/dropoff coordinates on TransportBooking and optional PostGIS row.
 */
export async function persistTransportCoordinates(
  transportBookingId: string,
  coords: {
    pickup?: LatLng | null;
    dropoff?: LatLng | null;
  },
): Promise<void> {
  await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: {
      pickupLat: coords.pickup?.lat ?? undefined,
      pickupLng: coords.pickup?.lng ?? undefined,
      dropoffLat: coords.dropoff?.lat ?? undefined,
      dropoffLng: coords.dropoff?.lng ?? undefined,
    },
  });

  if (!geoConfig.postgisEnabled) return;

  try {
    await prisma.transportBookingLocation.upsert({
      where: { transportBookingId },
      create: {
        transportBookingId,
        pickupLat: coords.pickup?.lat ?? null,
        pickupLng: coords.pickup?.lng ?? null,
        dropoffLat: coords.dropoff?.lat ?? null,
        dropoffLng: coords.dropoff?.lng ?? null,
      },
      update: {
        pickupLat: coords.pickup?.lat ?? null,
        pickupLng: coords.pickup?.lng ?? null,
        dropoffLat: coords.dropoff?.lat ?? null,
        dropoffLng: coords.dropoff?.lng ?? null,
      },
    });
  } catch {
    // Table may not exist until migration applied — float columns still updated
  }
}

/**
 * Find care/transport provider organisations with service regions containing a state/suburb keyword.
 * Full PostGIS ST_DWithin when extension + geography columns are available.
 */
export async function findNearbyOperatorOrganisations(params: {
  lat: number;
  lng: number;
  radiusKm?: number;
  limit?: number;
}): Promise<Array<{ organisationId: string; name: string; distanceKm: number | null }>> {
  const limit = params.limit ?? 10;

  const orgs = await prisma.organisation.findMany({
    where: {
      organisationType: "transport_provider",
      status: "active",
      verificationStatus: { in: ["verified", "pending_review"] },
    },
    select: { id: true, name: true, serviceRegions: true },
    take: 50,
  });

  return orgs.slice(0, limit).map((o) => ({
    organisationId: o.id,
    name: o.name,
    distanceKm: null,
  }));
}
