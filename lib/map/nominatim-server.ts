/**
 * Server-side forward geocode via Nominatim (OpenStreetMap).
 * Respect usage policy: low volume, descriptive User-Agent, cache at call site if needed.
 */

import {
  isNominatimGeocodingConfigured,
  isOpenStreetMapConfigured,
  openStreetMapConfig,
} from "@/lib/config/openstreetmap";

export async function forwardGeocodeAustralia(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!isNominatimGeocodingConfigured()) return null;

  const q = query.trim();
  if (!q) return null;

  const url = new URL(`${openStreetMapConfig.nominatimBaseUrl}/search`);
  url.searchParams.set("q", `${q}, Australia`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": openStreetMapConfig.nominatimUserAgent },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const hit = data[0];
  if (!hit?.lat || !hit.lon) return null;

  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

export type ReverseGeocodeResult = {
  postcode: string;
  suburb: string;
  state: string;
  displayName: string;
};

/** Server-side reverse geocode via Nominatim (OpenStreetMap). */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  if (!isOpenStreetMapConfigured()) return null;

  const url = new URL(`${openStreetMapConfig.nominatimBaseUrl}/reverse`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": openStreetMapConfig.nominatimUserAgent },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    address?: {
      postcode?: string;
      suburb?: string;
      village?: string;
      town?: string;
      state_district?: string;
      state?: string;
    };
    display_name?: string;
  };

  const addr = data.address ?? {};
  const postcode = addr.postcode ?? "";
  const suburb =
    addr.suburb ?? addr.village ?? addr.town ?? addr.state_district ?? "";
  const state = addr.state ?? "";

  return {
    postcode,
    suburb,
    state,
    displayName: data.display_name ?? "",
  };
}
