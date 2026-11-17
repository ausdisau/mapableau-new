import { tfnswConfig, isTfnswLiveTrafficAvailable } from "@/lib/config/tfnsw";
import { getLiveTrafficHazards } from "@/lib/tfnsw/live-traffic-service";
import type {
  LiveTrafficFeature,
  PermittedHazardEvidence,
  TrafficAdvisory,
  TrafficAdvisoryHazard,
} from "@/types/tfnsw";
import type { LatLng } from "@/types/transport-routing";

export const TRAFFIC_ADVISORY_DISCLAIMER =
  "Road hazard information is indicative only, sourced from Live Traffic NSW. It does not replace driver judgement or official directions.";

const EARTH_RADIUS_M = 6_371_000;
export const ROUTE_HAZARD_CORRIDOR_METRES = 250;

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function haversineMetres(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function distancePointToSegmentMetres(
  point: LatLng,
  a: LatLng,
  b: LatLng
): number {
  if (a.lat === b.lat && a.lng === b.lng) return haversineMetres(point, a);
  const ax = toRad(a.lng) * Math.cos(toRad(a.lat));
  const ay = toRad(a.lat);
  const bx = toRad(b.lng) * Math.cos(toRad(b.lat));
  const by = toRad(b.lat);
  const px = toRad(point.lng) * Math.cos(toRad(point.lat));
  const py = toRad(point.lat);
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))
  );
  const closest: LatLng = {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
  return haversineMetres(point, closest);
}

export function distancePointToPolylineMetres(
  point: LatLng,
  polyline: LatLng[]
): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) return haversineMetres(point, polyline[0]);
  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    min = Math.min(
      min,
      distancePointToSegmentMetres(point, polyline[i], polyline[i + 1])
    );
  }
  return min;
}

function extractPoint(feature: LiveTrafficFeature): LatLng | null {
  const geom = feature.geometry;
  if (!geom || geom.type !== "Point" || !("coordinates" in geom)) return null;
  const [lng, lat] = geom.coordinates as [number, number];
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng };
}

function extractLine(feature: LiveTrafficFeature): LatLng[] | null {
  const geom = feature.geometry;
  if (!geom || geom.type !== "LineString" || !("coordinates" in geom)) {
    return null;
  }
  const coords = geom.coordinates as [number, number][];
  const points = coords
    .map(([lng, lat]) => ({ lat, lng }))
    .filter((p) => typeof p.lat === "number" && typeof p.lng === "number");
  return points.length ? points : null;
}

function featurePoints(feature: LiveTrafficFeature): LatLng[] {
  const point = extractPoint(feature);
  if (point) return [point];
  return extractLine(feature) ?? [];
}

function bboxFromRoute(points: LatLng[], paddingMetres = 2000): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const padDeg = paddingMetres / 111_000;
  return {
    minLat: Math.min(...lats) - padDeg,
    maxLat: Math.max(...lats) + padDeg,
    minLng: Math.min(...lngs) - padDeg,
    maxLng: Math.max(...lngs) + padDeg,
  };
}

function inBbox(point: LatLng, box: ReturnType<typeof bboxFromRoute>): boolean {
  return (
    point.lat >= box.minLat &&
    point.lat <= box.maxLat &&
    point.lng >= box.minLng &&
    point.lng <= box.maxLng
  );
}

function featureHeadline(props: Record<string, unknown>): string | undefined {
  if (typeof props.headline === "string") return props.headline;
  if (typeof props.title === "string") return props.title;
  return undefined;
}

function featureId(props: Record<string, unknown>): string | undefined {
  if (typeof props.id === "string") return props.id;
  if (typeof props.guid === "string") return props.guid;
  return undefined;
}

function featureToHazard(
  feature: LiveTrafficFeature,
  distanceMetres: number,
  point: LatLng
): TrafficAdvisoryHazard {
  const props = feature.properties ?? {};
  const rounded = Math.round(distanceMetres);
  return {
    id: featureId(props),
    category: typeof props.category === "string" ? props.category : undefined,
    headline: featureHeadline(props),
    subCategory:
      typeof props.subCategory === "string" ? props.subCategory : undefined,
    lat: point.lat,
    lng: point.lng,
    distanceMetres: rounded,
    distanceToRouteMetres: rounded,
  };
}

export function permittedHazardEvidence(advisory: TrafficAdvisory): {
  source: "tfnsw_live_traffic";
  fetchedAt: string;
  hazards: PermittedHazardEvidence[];
} {
  return {
    source: "tfnsw_live_traffic",
    fetchedAt: advisory.fetchedAt,
    hazards: advisory.hazards.map((hazard) => ({
      id: hazard.id,
      category: hazard.category,
      headline: hazard.headline,
      subCategory: hazard.subCategory,
      distanceToRouteMetres:
        hazard.distanceToRouteMetres ?? hazard.distanceMetres,
    })),
  };
}

function hazardDedupeKey(hazard: TrafficAdvisoryHazard): string {
  return (
    hazard.id ??
    `${hazard.headline ?? ""}:${hazard.lat ?? ""}:${hazard.lng ?? ""}`
  );
}

/**
 * Returns open incidents and roadworks near a route.
 * When geometry is provided, matches by distance to the polyline (~250 m).
 * Otherwise falls back to a padded bbox around origin, waypoints and destination.
 */
export async function buildTrafficAdvisoryForRoute(params: {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  geometry?: LatLng[];
  maxHazards?: number;
  radiusMetres?: number;
  corridorMetres?: number;
  /** When true, runs even if TFNSW_ENRICH_ROUTE_ESTIMATES is off (explicit API calls) */
  force?: boolean;
}): Promise<TrafficAdvisory | null> {
  if (!isTfnswLiveTrafficAvailable()) {
    return null;
  }
  if (!params.force && !tfnswConfig.enrichRouteEstimates) {
    return null;
  }

  const corridor = [
    params.origin,
    ...(params.waypoints ?? []),
    params.destination,
  ];
  const geometry = params.geometry?.length ? params.geometry : corridor;
  const box = bboxFromRoute(geometry, params.radiusMetres ?? 3000);
  const max = params.maxHazards ?? 8;
  const matchMetres = params.corridorMetres ?? ROUTE_HAZARD_CORRIDOR_METRES;
  const usePolyline = Boolean(params.geometry?.length);

  try {
    const [incidents, roadworks] = await Promise.all([
      getLiveTrafficHazards({ category: "incident", state: "open" }),
      getLiveTrafficHazards({ category: "roadwork", state: "open" }),
    ]);
    const features = [
      ...(incidents.features ?? []),
      ...(roadworks.features ?? []),
    ];
    const hazards: TrafficAdvisoryHazard[] = [];

    for (const feature of features) {
      const points = featurePoints(feature);
      if (!points.length) continue;
      const inCorridor = points.some((p) => inBbox(p, box));
      if (!inCorridor) continue;

      let distance = Infinity;
      let nearest = points[0];
      for (const point of points) {
        const d = distancePointToPolylineMetres(point, geometry);
        if (d < distance) {
          distance = d;
          nearest = point;
        }
      }
      if (usePolyline && distance > matchMetres) continue;
      const hazard = featureToHazard(feature, distance, nearest);
      const key = hazardDedupeKey(hazard);
      if (hazards.some((existing) => hazardDedupeKey(existing) === key)) {
        continue;
      }
      hazards.push(hazard);
    }

    hazards.sort(
      (a, b) => (a.distanceMetres ?? Infinity) - (b.distanceMetres ?? Infinity)
    );

    return {
      source: "tfnsw_live_traffic",
      disclaimer: TRAFFIC_ADVISORY_DISCLAIMER,
      hazardCount: hazards.length,
      hazards: hazards.slice(0, max),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
