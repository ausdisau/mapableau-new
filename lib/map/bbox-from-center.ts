import type { MapBbox } from "@/lib/map/map-layer-query";

const KM_PER_DEGREE_LAT = 111.32;

/** Approximate bounding box around a center point (km). */
export function bboxFromCenter(
  lat: number,
  lng: number,
  radiusKm: number,
): MapBbox {
  const latDelta = radiusKm / KM_PER_DEGREE_LAT;
  const lngDelta =
    radiusKm / (KM_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

export function bboxToSearchParams(bbox: MapBbox): URLSearchParams {
  return new URLSearchParams({
    minLat: String(bbox.minLat),
    minLng: String(bbox.minLng),
    maxLat: String(bbox.maxLat),
    maxLng: String(bbox.maxLng),
  });
}
