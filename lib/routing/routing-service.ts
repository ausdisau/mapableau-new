import type { RouteConstraintType } from "@prisma/client";

import { schedulingConfig } from "@/lib/config/scheduling";
import { prisma } from "@/lib/prisma";
import {
  estimateDriveSeconds,
  fetchDirections,
  haversineMeters,
} from "@/lib/routing/openrouteservice-client";
import { isOrsConfigured } from "@/lib/config/scheduling";
import type { RouteResult, RoutingStopRef } from "@/types/routing";

const BOARDING_BUFFER_SECONDS = 300;

async function resolveStop(ref: RoutingStopRef): Promise<{ lat: number; lng: number }> {
  if (ref.type === "coordinate") return { lat: ref.lat, lng: ref.lng };
  if (ref.type === "participant_location") {
    const loc = await prisma.participantLocation.findUnique({
      where: { id: ref.id },
    });
    if (!loc) throw new Error("LOCATION_NOT_FOUND");
    return { lat: loc.lat, lng: loc.lng };
  }
  const site = await prisma.serviceSite.findUnique({ where: { id: ref.id } });
  if (!site) throw new Error("SITE_NOT_FOUND");
  return { lat: site.lat, lng: site.lng };
}

function applyConstraintBuffers(
  baseSeconds: number,
  constraints: { type: RouteConstraintType }[]
) {
  let total = baseSeconds;
  for (const c of constraints) {
    if (c.type === "extra_boarding_time") total += BOARDING_BUFFER_SECONDS;
    if (c.type === "driver_assistance_required") total += 180;
  }
  return total;
}

export async function computeRoute(
  stops: RoutingStopRef[],
  constraints: { type: RouteConstraintType }[] = []
): Promise<RouteResult> {
  const points = await Promise.all(stops.map(resolveStop));

  if (points.length < 2) {
    return {
      geometryGeoJson: null,
      legs: [],
      totalDurationSeconds: 0,
      totalDistanceMeters: 0,
      source: "none",
    };
  }

  let geometryGeoJson: GeoJSON.LineString | null = null;
  let legs: RouteResult["legs"] = [];
  let totalDurationSeconds = 0;
  let totalDistanceMeters = 0;
  let source = "haversine_fallback";

  if (
    isOrsConfigured() &&
    schedulingConfig.routingProvider === "openrouteservice"
  ) {
    try {
      const data = await fetchDirections(points);
      const route = data.routes?.[0];
      if (route?.geometry && typeof route.geometry === "object") {
        geometryGeoJson = route.geometry as GeoJSON.LineString;
      }
      totalDurationSeconds = Math.round(route?.summary?.duration ?? 0);
      totalDistanceMeters = Math.round(route?.summary?.distance ?? 0);
      const segments = route?.segments ?? [];
      legs = segments.map((seg, idx) => ({
        fromIndex: idx,
        toIndex: idx + 1,
        durationSeconds: Math.round(seg.duration),
        distanceMeters: Math.round(seg.distance),
      }));
      source = "openrouteservice";
    } catch {
      // fall through to haversine
    }
  }

  if (source === "haversine_fallback") {
    for (let i = 0; i < points.length - 1; i++) {
      const dist = haversineMeters(points[i], points[i + 1]) * 1.3;
      const dur = estimateDriveSeconds(dist);
      legs.push({
        fromIndex: i,
        toIndex: i + 1,
        durationSeconds: dur,
        distanceMeters: Math.round(dist),
      });
      totalDurationSeconds += dur;
      totalDistanceMeters += Math.round(dist);
    }
    geometryGeoJson = {
      type: "LineString",
      coordinates: points.map((p) => [p.lng, p.lat]),
    };
  }

  totalDurationSeconds = applyConstraintBuffers(totalDurationSeconds, constraints);

  return {
    geometryGeoJson,
    legs,
    totalDurationSeconds,
    totalDistanceMeters,
    source,
  };
}

export async function persistRoutePlanGeometry(
  routePlanId: string,
  result: RouteResult,
  stopIds: string[]
) {
  await prisma.routePlan.update({
    where: { id: routePlanId },
    data: {
      geometryGeoJson: (result.geometryGeoJson ?? undefined) as object | undefined,
      totalDurationSeconds: result.totalDurationSeconds,
      totalDistanceMeters: result.totalDistanceMeters,
    },
  });

  for (let i = 0; i < result.legs.length; i++) {
    const leg = result.legs[i];
    const fromStopId = stopIds[leg.fromIndex];
    const toStopId = stopIds[leg.toIndex];
    if (!fromStopId || !toStopId) continue;
    await prisma.travelTimeEstimate.create({
      data: {
        routePlanId,
        fromStopId,
        toStopId,
        minutes: Math.ceil(leg.durationSeconds / 60),
        durationSeconds: leg.durationSeconds,
        distanceMeters: leg.distanceMeters,
        source: result.source,
      },
    });
  }
}
