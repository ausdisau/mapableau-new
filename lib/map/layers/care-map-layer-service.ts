import type { CareShift, CareShiftStatus } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { geocodeAddress, geocodeSuburbPostcode } from "@/lib/map/geocoding-service";
import type { MapBbox } from "@/lib/map/map-layer-query";
import { pointInBbox } from "@/lib/map/map-layer-query";
import { prisma } from "@/lib/prisma";

const MAP_SHIFT_STATUSES: CareShiftStatus[] = [
  "scheduled",
  "worker_assigned",
  "confirmed",
  "worker_en_route",
  "checked_in",
  "in_progress",
];

const MAX_GEOCODE_PER_REQUEST = 20;

async function buildCareShiftWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  if (user.primaryRole === "support_worker") {
    return { workerProfile: { userId: user.id } };
  }
  if (user.primaryRole === "provider_admin") {
    const orgIds = await getUserOrganisationIds(user.id);
    return { organisationId: { in: orgIds } };
  }
  return { participantId: user.id };
}

async function resolveShiftCoordinates(
  shift: CareShift & {
    careRequest: {
      suburb: string | null;
      state: string | null;
      address: string | null;
    };
  },
): Promise<{ lat: number; lng: number } | null> {
  if (
    shift.checkInLatPlaceholder != null &&
    shift.checkInLngPlaceholder != null
  ) {
    return {
      lat: shift.checkInLatPlaceholder,
      lng: shift.checkInLngPlaceholder,
    };
  }

  const suburb = shift.careRequest.suburb ?? undefined;
  const state = shift.careRequest.state ?? undefined;
  if (suburb || state) {
    const coarse = await geocodeSuburbPostcode(suburb, undefined, state);
    if (coarse) return coarse;
  }

  const locationText = shift.location?.trim();
  if (locationText && !locationText.toLowerCase().includes("home")) {
    const results = await geocodeAddress(`${locationText}, Australia`, {
      limit: 1,
    });
    const first = results[0];
    if (first) return { lat: first.lat, lng: first.lng };
  }

  return null;
}

export async function getCareMapLayerGeoJson(
  user: CurrentUser,
  bbox: MapBbox,
): Promise<GeoJSON.FeatureCollection> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const shifts = await prisma.careShift.findMany({
    where: {
      ...(await buildCareShiftWhere(user)),
      status: { in: MAP_SHIFT_STATUSES },
      startAt: { gte: weekAgo, lte: weekAhead },
    },
    include: {
      careRequest: {
        select: { suburb: true, state: true, address: true },
      },
    },
    orderBy: { startAt: "asc" },
    take: 100,
  });

  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  let geocodeCount = 0;

  for (const shift of shifts) {
    let coords: { lat: number; lng: number } | null = null;

    if (
      shift.checkInLatPlaceholder != null &&
      shift.checkInLngPlaceholder != null
    ) {
      coords = {
        lat: shift.checkInLatPlaceholder,
        lng: shift.checkInLngPlaceholder,
      };
    } else if (geocodeCount < MAX_GEOCODE_PER_REQUEST) {
      coords = await resolveShiftCoordinates(shift);
      if (coords) geocodeCount += 1;
    }

    if (!coords || !pointInBbox(coords.lat, coords.lng, bbox)) continue;

    features.push({
      type: "Feature",
      id: shift.id,
      geometry: {
        type: "Point",
        coordinates: [coords.lng, coords.lat],
      },
      properties: {
        shiftId: shift.id,
        status: shift.status,
        startAt: shift.startAt.toISOString(),
        suburb: shift.careRequest.suburb ?? undefined,
      },
    });
  }

  return { type: "FeatureCollection", features };
}
