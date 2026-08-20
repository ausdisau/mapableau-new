import { distanceKm } from "@/lib/map/geo";

export type BBox = [number, number, number, number]; // west, south, east, north

export type PointGeometry = {
  type: "Point";
  coordinates: [number, number]; // lng, lat
  radiusKm?: number;
};

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][]; // GeoJSON rings [lng, lat]
};

export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

export type CampaignGeometry =
  | PointGeometry
  | PolygonGeometry
  | MultiPolygonGeometry
  | { type: "NATIONAL" };

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  // Ray casting
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!;
    const yi = ring[i]![1]!;
    const xj = ring[j]![0]!;
    const yj = ring[j]![1]!;
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygon(lng: number, lat: number, polygon: number[][][]): boolean {
  if (!polygon.length) return false;
  const outer = polygon[0]!;
  if (!pointInRing(lng, lat, outer)) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(lng, lat, polygon[i]!)) return false;
  }
  return true;
}

function bboxCenter(bbox: BBox): { lat: number; lng: number } {
  return {
    lng: (bbox[0] + bbox[2]) / 2,
    lat: (bbox[1] + bbox[3]) / 2,
  };
}

function bboxIntersectsPointRadius(
  bbox: BBox,
  lng: number,
  lat: number,
  radiusKm: number,
): boolean {
  const center = bboxCenter(bbox);
  if (distanceKm(center.lat, center.lng, lat, lng) <= radiusKm) return true;
  // Also check if point is inside bbox
  return (
    lng >= bbox[0] &&
    lng <= bbox[2] &&
    lat >= bbox[1] &&
    lat <= bbox[3]
  );
}

/**
 * Evaluate whether campaign geometry intersects the current map viewport.
 * Application-level (no PostGIS). NATIONAL always matches.
 */
export function campaignGeometryIntersectsViewport(
  geometry: CampaignGeometry | null | undefined,
  viewportBBox: BBox | undefined,
  mapCenter?: { lat: number; lng: number },
): boolean {
  if (!geometry || geometry.type === "NATIONAL") return true;

  const probe =
    mapCenter ??
    (viewportBBox
      ? bboxCenter(viewportBBox)
      : undefined);

  if (!probe) {
    // Without viewport, only NATIONAL targets match; others defer to region strings.
    return false;
  }

  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates;
    const radius = geometry.radiusKm ?? 25;
    if (viewportBBox) {
      return bboxIntersectsPointRadius(viewportBBox, lng, lat, radius);
    }
    return distanceKm(probe.lat, probe.lng, lat, lng) <= radius;
  }

  if (geometry.type === "Polygon") {
    return pointInPolygon(probe.lng, probe.lat, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((poly) =>
      pointInPolygon(probe.lng, probe.lat, poly),
    );
  }

  return false;
}

export function parseCampaignGeometry(
  raw: unknown,
): CampaignGeometry | null {
  if (!raw || typeof raw !== "object") return null;
  const g = raw as Record<string, unknown>;
  if (g.type === "NATIONAL") return { type: "NATIONAL" };
  if (g.type === "Point" && Array.isArray(g.coordinates)) {
    return {
      type: "Point",
      coordinates: g.coordinates as [number, number],
      radiusKm: typeof g.radiusKm === "number" ? g.radiusKm : undefined,
    };
  }
  if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
    return { type: "Polygon", coordinates: g.coordinates as number[][][] };
  }
  if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
    return {
      type: "MultiPolygon",
      coordinates: g.coordinates as number[][][][],
    };
  }
  return null;
}
