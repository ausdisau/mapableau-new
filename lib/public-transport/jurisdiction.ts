import type { PtJurisdiction } from "@/lib/public-transport/types";

/** Rough bounding boxes for auto-detecting PT jurisdiction from coordinates. */
const BOUNDS: Record<
  PtJurisdiction,
  { minLat: number; maxLat: number; minLng: number; maxLng: number }
> = {
  ACT: { minLat: -35.95, maxLat: -35.05, minLng: 148.7, maxLng: 149.45 },
  SA: { minLat: -38.2, maxLat: -25.9, minLng: 129.0, maxLng: 141.0 },
  WA: { minLat: -35.5, maxLat: -13.5, minLng: 112.9, maxLng: 129.0 },
  TAS: { minLat: -43.8, maxLat: -39.5, minLng: 144.5, maxLng: 148.5 },
  NT: { minLat: -26.0, maxLat: -10.5, minLng: 129.0, maxLng: 138.0 },
  NSW: { minLat: -37.6, maxLat: -28.0, minLng: 140.9, maxLng: 153.7 },
  VIC: { minLat: -39.3, maxLat: -33.8, minLng: 140.8, maxLng: 150.1 },
  QLD: { minLat: -29.5, maxLat: -9.0, minLng: 138.0, maxLng: 153.6 },
};

/** Smaller territories first so they win over overlapping state boxes (e.g. Canberra vs NSW). */
const ORDER: PtJurisdiction[] = [
  "ACT",
  "SA",
  "NT",
  "WA",
  "TAS",
  "VIC",
  "NSW",
  "QLD",
];

const ALL_JURISDICTIONS: PtJurisdiction[] = [
  "NSW",
  "VIC",
  "QLD",
  "ACT",
  "SA",
  "WA",
  "TAS",
  "NT",
];

export function isPtJurisdiction(value: string): value is PtJurisdiction {
  return ALL_JURISDICTIONS.includes(value as PtJurisdiction);
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
