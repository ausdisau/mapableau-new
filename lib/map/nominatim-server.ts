/**
 * Server-side forward geocode via Nominatim (OpenStreetMap).
 * Respect usage policy: low volume, descriptive User-Agent, cache at call site if needed.
 */

const USER_AGENT = "MapAbleAU-Geocoding/1.0 (https://mapable.com.au)";

export async function forwardGeocodeAustralia(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${q}, Australia`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
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
