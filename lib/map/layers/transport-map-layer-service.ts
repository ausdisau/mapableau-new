import type { TransportTrip } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  tripsToLineGeoJSON,
  tripsToStopsGeoJSON,
} from "@/lib/map/map-feature-query";
import type { MapBbox } from "@/lib/map/map-layer-query";
import { resolveTripAccess } from "@/lib/transport/transport-access-policy";
import { prisma } from "@/lib/prisma";

async function buildTransportTripWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  if (user.primaryRole === "driver") {
    const driver = await prisma.transportDriver.findFirst({
      where: { userId: user.id, active: true },
    });
    if (!driver) return { id: { in: [] as string[] } };
    const assignments = await prisma.transportDispatchAssignment.findMany({
      where: { driverId: driver.id, active: true },
      select: { tripId: true },
    });
    return { id: { in: assignments.map((a) => a.tripId) } };
  }
  if (
    user.primaryRole === "transport_operator" ||
    user.primaryRole === "provider_admin"
  ) {
    const orgIds = await getUserOrganisationIds(user.id);
    return { providerOrganisationId: { in: orgIds } };
  }
  return { participantId: user.id };
}

function tripHasExactCoords(trip: TransportTrip): boolean {
  return (
    trip.pickupLat != null &&
    trip.pickupLng != null &&
    trip.dropoffLat != null &&
    trip.dropoffLng != null
  );
}

export type TransportMapLayerPayload = {
  lines: GeoJSON.FeatureCollection<GeoJSON.LineString>;
  stops: GeoJSON.FeatureCollection<GeoJSON.Point>;
};

export async function getTransportMapLayerGeoJson(
  user: CurrentUser,
  bbox: MapBbox,
): Promise<TransportMapLayerPayload> {
  const trips = await prisma.transportTrip.findMany({
    where: await buildTransportTripWhere(user),
    orderBy: { scheduledStart: "desc" },
    take: 100,
  });

  const mappable: Array<{
    id: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    pickupSuburb: string | null;
    dropoffSuburb: string | null;
    status: string;
  }> = [];

  for (const trip of trips) {
    if (!tripHasExactCoords(trip)) continue;
    const access = await resolveTripAccess(user, trip);
    if (access !== "exact") continue;
    mappable.push({
      id: trip.id,
      pickupLat: trip.pickupLat!,
      pickupLng: trip.pickupLng!,
      dropoffLat: trip.dropoffLat!,
      dropoffLng: trip.dropoffLng!,
      pickupSuburb: trip.pickupSuburb,
      dropoffSuburb: trip.dropoffSuburb,
      status: trip.status,
    });
  }

  return {
    lines: tripsToLineGeoJSON(mappable, bbox),
    stops: tripsToStopsGeoJSON(mappable, bbox),
  };
}
