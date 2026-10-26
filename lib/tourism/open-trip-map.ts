/**
 * Public, non-sensitive OpenTripMap place-discovery types and validation.
 * These records are tourism POIs, NOT verified disability-access information.
 */
export type OpenTripMapKind = "interesting_places" | "museums" | "historic" | "natural";

export type OpenTripMapPlace = {
  xid: string;
  name: string;
  latitude: number;
  longitude: number;
  kinds: string[];
  distanceMeters?: number;
  retrievedAt: string;
};

export type OpenTripMapSearchResponse = {
  status: "live" | "disabled" | "error";
  places: OpenTripMapPlace[];
  message: string;
  retrievedAt?: string;
};

const XID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const KIND_PATTERN = /^[a-z0-9_]{1,48}$/;

export function isOpenTripMapPlace(value: unknown): value is OpenTripMapPlace {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<OpenTripMapPlace>;
  return typeof p.xid === "string" && XID_PATTERN.test(p.xid) &&
    typeof p.name === "string" && p.name.trim().length > 0 && p.name.length <= 160 &&
    typeof p.latitude === "number" && Number.isFinite(p.latitude) && p.latitude >= -90 && p.latitude <= 90 &&
    typeof p.longitude === "number" && Number.isFinite(p.longitude) && p.longitude >= -180 && p.longitude <= 180 &&
    Array.isArray(p.kinds) && p.kinds.length <= 5 &&
    p.kinds.every((k) => typeof k === "string" && KIND_PATTERN.test(k)) &&
    typeof p.retrievedAt === "string" && Number.isFinite(Date.parse(p.retrievedAt));
}

/**
 * The OpenTripMap /radius and /autosuggest JSON response is an array
 * { xid, name, point:{ lon,lat }, kinds, dist? }. Reject malformed and
 * out-of-Sydney objects rather than sending raw third-party JSON to a client.
 */
export function normaliseOpenTripMapPlaces(input: unknown, retrievedAt: string): OpenTripMapPlace[] {
  if (!Array.isArray(input)) throw new Error("Invalid OpenTripMap list response");
  const ids = new Set<string>();
  const result: OpenTripMapPlace[] = [];
  for (const value of input.slice(0, 150)) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const point = item.point && typeof item.point === "object"
      ? item.point as Record<string, unknown>
      : null;
    const name = typeof item.name === "string" ? item.name.trim().slice(0, 160) : "";
    const xid = typeof item.xid === "string" ? item.xid : "";
    const lat = point?.lat;
    const lon = point?.lon;
    // The pilot is Sydney-only. This secondary bounds check defends against
    // unexpected upstream data, not against physical accessibility barriers.
    if (!XID_PATTERN.test(xid) || !name || ids.has(xid) ||
      typeof lat !== "number" || typeof lon !== "number" ||
      !Number.isFinite(lat) || !Number.isFinite(lon) ||
      lat < -34.05 || lat > -33.65 || lon < 150.98 || lon > 151.40) continue;
    const kinds = typeof item.kinds === "string"
      ? item.kinds.split(",").filter((k) => KIND_PATTERN.test(k)).slice(0, 5)
      : [];
    const place: OpenTripMapPlace = { xid, name, latitude: lat, longitude: lon, kinds, retrievedAt };
    if (typeof item.dist === "number" && Number.isFinite(item.dist) && item.dist >= 0) {
      place.distanceMeters = item.dist;
    }
    ids.add(xid);
    result.push(place);
    if (result.length === 30) break;
  }
  return result;
}
