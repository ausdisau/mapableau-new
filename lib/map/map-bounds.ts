import type { LngLatBoundsLike } from "maplibre-gl";

export interface LngLatPoint {
  lng: number;
  lat: number;
}

export function pointsToBounds(
  points: LngLatPoint[],
  padding = 0.02,
): LngLatBoundsLike | undefined {
  if (points.length === 0) return undefined;
  if (points.length === 1) {
    const { lng, lat } = points[0];
    return [
      [lng - padding, lat - padding],
      [lng + padding, lat + padding],
    ];
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const { lng, lat } of points) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function bboxFromMapBounds(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): string {
  return `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`;
}
