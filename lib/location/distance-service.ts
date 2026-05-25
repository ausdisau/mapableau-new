import { distanceKm } from "@/lib/geo";
import type { ProviderDistanceKind } from "@/types/location";

/** Haversine distance in km (upgrade path: PostGIS ST_DWithin). */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  return distanceKm(lat1, lng1, lat2, lng2);
}

export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "Distance unavailable";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

export function buildDistanceLabel(
  distanceKm: number | null,
  kind: ProviderDistanceKind,
): string {
  if (kind === "service_area") return "Serves your area";
  if (distanceKm == null || !Number.isFinite(distanceKm)) return "Distance unavailable";
  const base = formatDistanceKm(distanceKm);
  if (kind === "approximate") {
    return `Approx. ${distanceKm.toFixed(1)} km away`;
  }
  return base;
}

export function isWithinRadiusKm(
  userLat: number,
  userLng: number,
  providerLat: number,
  providerLng: number,
  radiusKm: number,
): boolean {
  return haversineDistanceKm(userLat, userLng, providerLat, providerLng) <= radiusKm;
}
