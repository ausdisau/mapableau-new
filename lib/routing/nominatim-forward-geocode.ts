/**
 * Server-side forward geocoding via Nominatim (OpenStreetMap).
 * Use sparingly; respect Nominatim usage policy (1 req/sec, descriptive User-Agent).
 */

const USER_AGENT = "MapableAU-TransportRouting/1.0 (NDIS transport routing)";

export type ForwardGeocodeResult = {
  lat: number;
  lng: number;
  label: string;
};

export async function nominatimForwardGeocode(
  query: string,
  countryCodes = "au",
): Promise<ForwardGeocodeResult | null> {
  const q = query.trim();
  if (q.length < 3) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", countryCodes);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;
  const first = data[0];
  if (!first?.lat || !first?.lon) return null;

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
    label: first.display_name ?? q,
  };
}
