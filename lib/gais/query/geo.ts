import {
  GAIS_MAX_BOUNDS_SPAN_DEGREES,
  type GaisBounds,
} from "@/lib/gais/contracts/bounds";

import { GAIS_MAX_RADIUS_METRES } from "./constants";
import type { GaisStructuredQuery } from "./request-schema";

const METRES_PER_DEGREE_LAT = 111_320;

export type GeoValidationResult =
  | { ok: true; bounds: GaisBounds }
  | { ok: false; errors: string[] };

function boundsFromRadius(
  lat: number,
  lng: number,
  radiusMetres: number,
): GaisBounds {
  const latDelta = radiusMetres / METRES_PER_DEGREE_LAT;
  const lngScale = Math.cos((lat * Math.PI) / 180);
  const lngDelta = radiusMetres / (METRES_PER_DEGREE_LAT * Math.max(lngScale, 0.01));

  return {
    minLat: lat - latDelta,
    minLng: lng - lngDelta,
    maxLat: lat + latDelta,
    maxLng: lng + lngDelta,
  };
}

function spanWithinLimit(bounds: GaisBounds): boolean {
  return (
    bounds.maxLat - bounds.minLat <= GAIS_MAX_BOUNDS_SPAN_DEGREES &&
    bounds.maxLng - bounds.minLng <= GAIS_MAX_BOUNDS_SPAN_DEGREES
  );
}

export function resolveQueryBounds(query: GaisStructuredQuery): GeoValidationResult {
  const errors: string[] = [];

  if (query.bounds) {
    if (!spanWithinLimit(query.bounds)) {
      errors.push(
        `Bounding box exceeds maximum span of ${GAIS_MAX_BOUNDS_SPAN_DEGREES} degrees`,
      );
    }
    if (errors.length) return { ok: false, errors };
    return { ok: true, bounds: query.bounds };
  }

  if (query.location) {
    if (query.location.radiusMetres > GAIS_MAX_RADIUS_METRES) {
      errors.push(`radiusMetres exceeds maximum of ${GAIS_MAX_RADIUS_METRES}`);
    }
    const bounds = boundsFromRadius(
      query.location.lat,
      query.location.lng,
      query.location.radiusMetres,
    );
    if (!spanWithinLimit(bounds)) {
      errors.push("Derived bounds exceed maximum allowed span");
    }
    if (errors.length) return { ok: false, errors };
    return {
      ok: true,
      bounds: {
        ...bounds,
        limit: query.limit,
      },
    };
  }

  return { ok: false, errors: ["bounds or location is required"] };
}

export function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const r = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}
