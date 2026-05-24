import { geoConfig } from "@/lib/config/geo";

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
};

/**
 * Geocode an Australian address via Nominatim (OSM). Rate-limit friendly for MVP.
 */
export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  if (!geoConfig.geocodingEnabled) return null;

  const q = `${address.trim()}, Australia`;
  const url = new URL("/search", geoConfig.nominatimBaseUrl);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "MapAbleAU/1.0 (disability services platform)",
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
  }>;

  const first = data[0];
  if (!first) return null;

  return {
    lat: parseFloat(first.lat),
    lng: parseFloat(first.lon),
    displayName: first.display_name,
  };
}
