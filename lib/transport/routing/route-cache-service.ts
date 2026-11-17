import { prisma } from "@/lib/prisma";
import type { LatLng, RouteOptions } from "@/types/transport-routing";

const memoryCache = new Map<string, { estimateId: string; expiresAt: number }>();

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

function unexpiredWhere(now: Date) {
  return {
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

function isUnexpired(
  row: { expiresAt?: Date | null },
  nowMs: number
): boolean {
  return !row.expiresAt || row.expiresAt.getTime() > nowMs;
}

export async function getCachedEstimate(cacheKey: string) {
  const now = Date.now();
  const mem = memoryCache.get(cacheKey);
  if (mem && mem.expiresAt > now) {
    const row = await prisma.transportRouteEstimate.findUnique({
      where: { id: mem.estimateId },
    });
    if (row && isUnexpired(row, now) && !row.tripId) {
      return row;
    }
    memoryCache.delete(cacheKey);
  }

  const asOf = new Date(now);
  const shared = await prisma.transportRouteEstimate.findFirst({
    where: {
      cacheKey,
      tripId: null,
      ...unexpiredWhere(asOf),
    },
    orderBy: { createdAt: "desc" },
  });
  if (shared && isUnexpired(shared, now)) return shared;

  const legacy = await prisma.transportRouteEstimate.findFirst({
    where: {
      cacheKey,
      ...unexpiredWhere(asOf),
    },
    orderBy: { createdAt: "desc" },
  });
  if (!legacy || !isUnexpired(legacy, now)) return null;
  return legacy;
}

export function rememberEstimate(
  cacheKey: string,
  estimateId: string,
  ttlMs = 15 * 60 * 1000,
  _tripId?: string
) {
  void _tripId;
  memoryCache.set(cacheKey, {
    estimateId,
    expiresAt: Date.now() + ttlMs,
  });
}

export function forgetCachedEstimate(cacheKey?: string) {
  if (cacheKey) memoryCache.delete(cacheKey);
}

export async function expireEstimatesForTrip(tripId: string) {
  const now = new Date();
  await prisma.transportRouteEstimate.updateMany({
    where: { tripId, ...unexpiredWhere(now) },
    data: { expiresAt: now },
  });
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
