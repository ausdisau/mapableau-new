import { schedulingConfig, isOrsConfigured } from "@/lib/config/scheduling";
import {
  assertNoPiiInOrsPayload,
  buildOrsRoutingPayload,
} from "@/lib/geo/privacy-boundary";

type OrsDirectionsResponse = {
  routes?: {
    summary?: { duration?: number; distance?: number };
    geometry?: string;
    segments?: { distance: number; duration: number }[];
  }[];
};

type OrsMatrixResponse = {
  durations?: (number | null)[][];
  distances?: (number | null)[][];
};

async function orsFetch<T>(
  path: string,
  body: unknown,
  idempotencyKey?: string
): Promise<T> {
  if (!isOrsConfigured()) {
    throw new Error("ORS_NOT_CONFIGURED");
  }
  assertNoPiiInOrsPayload(body);

  const headers: Record<string, string> = {
    Authorization: schedulingConfig.orsApiKey,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${schedulingConfig.orsBaseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ORS_HTTP_${res.status}:${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDirections(
  points: { lat: number; lng: number }[],
  profile = "driving-car",
  idempotencyKey?: string
) {
  const payload = buildOrsRoutingPayload(points, profile);
  return orsFetch<OrsDirectionsResponse>(
    `/v2/directions/${profile}/geojson`,
    payload,
    idempotencyKey
  );
}

export async function fetchMatrix(
  points: { lat: number; lng: number }[],
  profile = "driving-car",
  idempotencyKey?: string
) {
  const payload = buildOrsRoutingPayload(points, profile);
  return orsFetch<OrsMatrixResponse>(
    `/v2/matrix/${profile}`,
    {
      locations: payload.coordinates,
      metrics: ["duration", "distance"],
    },
    idempotencyKey
  );
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function estimateDriveSeconds(distanceMeters: number) {
  const speedMps = 40_000 / 3600;
  return Math.round(distanceMeters / speedMps);
}
