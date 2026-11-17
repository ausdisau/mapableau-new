import { prisma } from "@/lib/prisma";
import type { LatLng, RouteOptions } from "@/types/transport-routing";

const memoryCache = new Map<
  string,
  { estimateId: string; expiresAt: number; tripId?: string }
>();

export const COORD_DECIMALS = 5;
export const TIME_BUCKET_MINUTES = 15;

export function roundCoord(value: number, decimals = COORD_DECIMALS): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

export function formatCoord(point: LatLng): string {
  return `${roundCoord(point.lat).toFixed(COORD_DECIMALS)},${roundCoord(point.lng).toFixed(COORD_DECIMALS)}`;
}

export function timeBucketIso(
  departAt?: string | Date | null,
  now = new Date()
): string {
  const source = departAt ? new Date(departAt) : now;
  const ms = Number.isNaN(source.getTime()) ? now.getTime() : source.getTime();
  const bucketMs = TIME_BUCKET_MINUTES * 60 * 1000;
  return new Date(Math.floor(ms / bucketMs) * bucketMs).toISOString();
}

export function hashRouteOptions(options?: RouteOptions): string {
  const avoid = [...(options?.avoid ?? [])].sort().join(",");
  const routeType = options?.routeType ?? "fast";
  return `${routeType}:${avoid}`;
}

export function buildRouteCacheKey(parts: {
  provider: string;
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  departAt?: string | Date | null;
  routeOptions?: RouteOptions;
}): string {
  const waypoints = (parts.waypoints ?? []).map(formatCoord).join(";");
  const trafficMode = parts.routeOptions?.trafficMode ?? "none";
  return [
    parts.provider,
    trafficMode,
    hashRouteOptions(parts.routeOptions),
    timeBucketIso(parts.departAt),
    formatCoord(parts.origin),
    waypoints || "-",
    formatCoord(parts.destination),
  ].join("|");
}

export async function getCachedEstimate(cacheKey: string) {
  const now = Date.now();
  const mem = memoryCache.get(cacheKey);
  if (mem && mem.expiresAt > now) {
    const row = await prisma.transportRouteEstimate.findUnique({
      where: { id: mem.estimateId },
    });
    if (row && (!row.expiresAt || row.expiresAt.getTime() > now)) {
      return row;
    }
    memoryCache.delete(cacheKey);
  }

  const row = await prisma.transportRouteEstimate.findFirst({
    where: {
      cacheKey,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date(now) } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() <= now) return null;
  return row;
}

export function rememberEstimate(
  cacheKey: string,
  estimateId: string,
  ttlMs = 15 * 60 * 1000,
  tripId?: string
) {
  memoryCache.set(cacheKey, {
    estimateId,
    expiresAt: Date.now() + ttlMs,
    tripId,
  });
}

export function forgetCachedEstimate(cacheKey?: string) {
  if (cacheKey) memoryCache.delete(cacheKey);
}

export async function expireEstimatesForTrip(tripId: string) {
  const now = new Date();
  await prisma.transportRouteEstimate.updateMany({
    where: { tripId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    data: { expiresAt: now },
  });
  for (const [key, value] of memoryCache.entries()) {
    if (value.tripId === tripId) memoryCache.delete(key);
  }
}

export async function refreshRouteCache(params: {
  cacheKey?: string;
  tripId?: string;
}) {
  if (params.cacheKey) memoryCache.delete(params.cacheKey);
  if (params.tripId) {
    await expireEstimatesForTrip(params.tripId);
  }
  return { refreshed: true };
}

export function clearRouteMemoryCacheForTests() {
  memoryCache.clear();
}
