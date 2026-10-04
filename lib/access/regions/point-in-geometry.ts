import type {
  AccessCapitalRegionSlug,
  GccsaBoundaryFeature,
  GccsaBoundaryFeatureCollection,
} from "@/lib/access/regions/gccsa";

type Position = [number, number];

function isPosition(value: unknown): value is Position {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

function pointInRing(point: Position, ring: unknown): boolean {
  if (!Array.isArray(ring)) return false;
  const points = ring.filter(isPosition);
  if (points.length < 3) return false;

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point: Position, polygon: unknown): boolean {
  if (!Array.isArray(polygon) || polygon.length === 0) return false;
  if (!pointInRing(point, polygon[0])) return false;

  for (let i = 1; i < polygon.length; i += 1) {
    if (pointInRing(point, polygon[i])) return false;
  }

  return true;
}

function pointInFeature(point: Position, feature: GccsaBoundaryFeature): boolean {
  const coordinates = feature.geometry.coordinates;

  if (feature.geometry.type === "Polygon") {
    return pointInPolygon(point, coordinates);
  }

  if (!Array.isArray(coordinates)) return false;
  return coordinates.some((polygon) => pointInPolygon(point, polygon));
}

export function pointIsInGccsaRegion(input: {
  latitude: number;
  longitude: number;
  slug: AccessCapitalRegionSlug;
  boundary: GccsaBoundaryFeatureCollection;
}): boolean {
  const feature = input.boundary.features.find(
    (item) => item.properties.mapableSlug === input.slug,
  );
  if (!feature) return false;
  return pointInFeature([input.longitude, input.latitude], feature);
}
