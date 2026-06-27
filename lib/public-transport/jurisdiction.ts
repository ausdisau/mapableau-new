import type { PtJurisdiction } from "@/lib/public-transport/types";

/** Rough bounding boxes for auto-detecting PT jurisdiction from coordinates. */
const BOUNDS: Record<
  PtJurisdiction,
  { minLat: number; maxLat: number; minLng: number; maxLng: number }
> = {
  NSW: { minLat: -37.6, maxLat: -28.0, minLng: 140.9, maxLng: 153.7 },
  VIC: { minLat: -39.3, maxLat: -33.8, minLng: 140.8, maxLng: 150.1 },
  QLD: { minLat: -29.5, maxLat: -9.0, minLng: 138.0, maxLng: 153.6 },
};

const ORDER: PtJurisdiction[] = ["NSW", "VIC", "QLD"];

export function isPtJurisdiction(value: string): value is PtJurisdiction {
  return value === "NSW" || value === "VIC" || value === "QLD";
}

export function resolveJurisdictionFromCoords(
  lat: number,
  lng: number
): PtJurisdiction | null {
  const matches = ORDER.filter((j) => {
    const b = BOUNDS[j];
    return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
  });
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0]!;
  // Border overlap: prefer NSW > VIC > QLD by population/coverage priority for MapAble
  return matches[0]!;
}

export function resolveJurisdiction(params: {
  jurisdiction?: string | null;
  lat?: number | null;
  lng?: number | null;
}): PtJurisdiction | null {
  if (params.jurisdiction && isPtJurisdiction(params.jurisdiction)) {
    return params.jurisdiction;
  }
  if (params.lat != null && params.lng != null) {
    return resolveJurisdictionFromCoords(params.lat, params.lng);
  }
  return null;
}
