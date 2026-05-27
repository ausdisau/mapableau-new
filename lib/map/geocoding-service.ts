const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Mapable/1.0 (provider-finder; contact@mapable.com.au)";

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
  suburb?: string;
  state?: string;
  postcode?: string;
};

export async function geocodeAddress(
  query: string,
  options?: { limit?: number },
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const limit = Math.min(options?.limit ?? 5, 10);
  const url = new URL(NOMINATIM_BASE);
  url.searchParams.set("q", trimmed);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "au");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const rows = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: {
      suburb?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      postcode?: string;
    };
  }>;

  return rows.map((row) => {
    const suburb =
      row.address?.suburb ??
      row.address?.city ??
      row.address?.town ??
      row.address?.village;
    return {
      lat: Number.parseFloat(row.lat),
      lng: Number.parseFloat(row.lon),
      displayName: row.display_name,
      suburb,
      state: row.address?.state,
      postcode: row.address?.postcode,
    };
  });
}

export async function geocodeSuburbPostcode(
  suburb?: string,
  postcode?: string,
  state?: string,
): Promise<{ lat: number; lng: number } | null> {
  const parts = [suburb, state, postcode, "Australia"].filter(Boolean);
  if (parts.length <= 1) return null;
  const results = await geocodeAddress(parts.join(" "), { limit: 1 });
  const first = results[0];
  if (!first) return null;
  return { lat: first.lat, lng: first.lng };
}
