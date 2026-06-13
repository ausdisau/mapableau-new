export type ImageBounds = {
  northWest: { lng: number; lat: number };
  southEast: { lng: number; lat: number };
};

export function parseImageBounds(raw: unknown): ImageBounds | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const nw = (obj.northWest ?? obj.nw) as
    | { lng?: number; lat?: number }
    | undefined;
  const se = (obj.southEast ?? obj.se) as
    | { lng?: number; lat?: number }
    | undefined;

  if (
    nw?.lng == null ||
    nw.lat == null ||
    se?.lng == null ||
    se.lat == null
  ) {
    return null;
  }

  return {
    northWest: { lng: nw.lng, lat: nw.lat },
    southEast: { lng: se.lng, lat: se.lat },
  };
}

export function normalizedToLngLat(
  xNorm: number,
  yNorm: number,
  bounds: ImageBounds | null,
  fallback?: { lng: number; lat: number }
): [number, number] {
  if (!bounds) {
    if (fallback) return [fallback.lng, fallback.lat];
    return [0, 0];
  }

  const lng =
    bounds.northWest.lng +
    xNorm * (bounds.southEast.lng - bounds.northWest.lng);
  const lat =
    bounds.northWest.lat +
    yNorm * (bounds.southEast.lat - bounds.northWest.lat);

  return [lng, lat];
}

export function footprintCentroid(
  footprint: GeoJSON.Polygon | GeoJSON.MultiPolygon | null | undefined
): { lng: number; lat: number } | null {
  if (!footprint) return null;

  const ring =
    footprint.type === "Polygon"
      ? footprint.coordinates[0]
      : footprint.coordinates[0]?.[0];

  if (!ring?.length) return null;

  let lngSum = 0;
  let latSum = 0;
  const count = ring.length - 1 > 0 ? ring.length - 1 : ring.length;

  for (let i = 0; i < count; i += 1) {
    lngSum += ring[i][0];
    latSum += ring[i][1];
  }

  return { lng: lngSum / count, lat: latSum / count };
}

export function boundsFromFootprint(
  footprint: GeoJSON.Polygon | GeoJSON.MultiPolygon
): [[number, number], [number, number]] {
  const ring =
    footprint.type === "Polygon"
      ? footprint.coordinates[0]
      : footprint.coordinates[0][0];

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of ring) {
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

export function imageBoundsFromFootprint(
  footprint: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  insetRatio = 0.05
): ImageBounds {
  const [[minLng, minLat], [maxLng, maxLat]] = boundsFromFootprint(footprint);
  const lngPad = (maxLng - minLng) * insetRatio;
  const latPad = (maxLat - minLat) * insetRatio;

  return {
    northWest: { lng: minLng + lngPad, lat: maxLat - latPad },
    southEast: { lng: maxLng - lngPad, lat: minLat + latPad },
  };
}
