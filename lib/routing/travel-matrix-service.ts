import type { TravelMatrixSource } from "@prisma/client";

import { schedulingConfig } from "@/lib/config/scheduling";
import { prisma } from "@/lib/prisma";
import {
  estimateDriveSeconds,
  fetchMatrix,
  haversineMeters,
} from "@/lib/routing/openrouteservice-client";
import { isOrsConfigured } from "@/lib/config/scheduling";

function cacheKeyUnused(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  return `${from.lat},${from.lng}->${to.lat},${to.lng}`;
}

export async function getTravelTimeSeconds(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<{ durationSeconds: number; distanceMeters: number; source: TravelMatrixSource }> {
  const now = new Date();
  const cached = await prisma.travelTimeMatrixCache.findFirst({
    where: {
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });
  if (cached) {
    return {
      durationSeconds: cached.durationSeconds,
      distanceMeters: cached.distanceMeters,
      source: "cached",
    };
  }

  let durationSeconds: number;
  let distanceMeters: number;
  let source: TravelMatrixSource = "haversine_fallback";

  if (
    isOrsConfigured() &&
    schedulingConfig.routingProvider === "openrouteservice"
  ) {
    try {
      const matrix = await fetchMatrix([from, to]);
      const d = matrix.durations?.[0]?.[1];
      const dist = matrix.distances?.[0]?.[1];
      if (d != null && dist != null) {
        durationSeconds = Math.round(d);
        distanceMeters = Math.round(dist);
        source = "openrouteservice";
      } else {
        throw new Error("ORS_MATRIX_EMPTY");
      }
    } catch {
      distanceMeters = Math.round(haversineMeters(from, to) * 1.3);
      durationSeconds = estimateDriveSeconds(distanceMeters);
    }
  } else {
    distanceMeters = Math.round(haversineMeters(from, to) * 1.3);
    durationSeconds = estimateDriveSeconds(distanceMeters);
  }

  const expiresAt = new Date(
    now.getTime() + schedulingConfig.matrixCacheTtlMinutes * 60_000
  );
  await prisma.travelTimeMatrixCache.create({
    data: {
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
      durationSeconds,
      distanceMeters,
      source,
      expiresAt,
    },
  });

  void cacheKeyUnused(from, to);
  return { durationSeconds, distanceMeters, source };
}

export async function getBatchMatrix(
  points: { lat: number; lng: number }[]
): Promise<
  { fromIndex: number; toIndex: number; durationSeconds: number; distanceMeters: number }[]
> {
  const cells: {
    fromIndex: number;
    toIndex: number;
    durationSeconds: number;
    distanceMeters: number;
  }[] = [];

  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const r = await getTravelTimeSeconds(points[i], points[j]);
      cells.push({
        fromIndex: i,
        toIndex: j,
        durationSeconds: r.durationSeconds,
        distanceMeters: r.distanceMeters,
      });
    }
  }
  return cells;
}
