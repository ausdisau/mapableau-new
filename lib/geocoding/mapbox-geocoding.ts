import {
  getMapboxAccessToken,
  getMapboxCountryCode,
  isMapboxGeocodingEnabled,
  MAPBOX_GEOCODING_BASE,
} from "@/lib/geocoding/mapbox-config";
import {
  mapboxPlaceToReverseResult,
  parseMapboxFeature,
  type MapboxGeocodeFeature,
  type ParsedMapboxPlace,
} from "@/lib/geocoding/parse-mapbox-feature";
import type { ReverseGeocodeResult } from "@/lib/geo";

type MapboxGeocodeResponse = {
  features?: MapboxGeocodeFeature[];
};

function buildUrl(pathSegment: string, params: Record<string, string>): URL {
  const token = getMapboxAccessToken();
  if (!token) {
    throw new Error("Mapbox geocoding is not configured");
  }
  const url = new URL(`${MAPBOX_GEOCODING_BASE}/${encodeURIComponent(pathSegment)}.json`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", token);
  return url;
}

async function fetchMapboxFeatures(url: URL): Promise<MapboxGeocodeFeature[]> {
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Mapbox geocoding failed: ${res.status}${text ? ` — ${text.slice(0, 120)}` : ""}`,
    );
  }
  const data = (await res.json()) as MapboxGeocodeResponse;
  return data.features ?? [];
}

/**
 * Forward geocode (Australia-biased). Server-side only.
 */
export async function mapboxForwardGeocode(
  query: string,
  limit = 5,
): Promise<ParsedMapboxPlace[]> {
  if (!isMapboxGeocodingEnabled()) return [];

  const q = query.trim();
  if (q.length < 2) return [];

  const url = buildUrl(q, {
    country: getMapboxCountryCode(),
    limit: String(Math.min(Math.max(limit, 1), 10)),
    types: "postcode,place,locality,district,region,address",
    autocomplete: "true",
    language: "en",
  });

  const features = await fetchMapboxFeatures(url);
  return features.map(parseMapboxFeature);
}

/**
 * Reverse geocode lat/lng to postcode/suburb/state. Server-side only.
 */
export async function mapboxReverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  if (!isMapboxGeocodingEnabled()) {
    throw new Error("Mapbox geocoding is not configured");
  }

  const url = buildUrl(`${lng},${lat}`, {
    country: getMapboxCountryCode(),
    types: "postcode,place,locality,district,region,address",
    language: "en",
  });

  const features = await fetchMapboxFeatures(url);
  const first = features[0];
  if (!first) {
    throw new Error("No address found for this location");
  }
  return mapboxPlaceToReverseResult(parseMapboxFeature(first));
}
