export type GeocodeResult = {
  lat: number;
  lng: number;
  label: string;
};

const NOMINATIM_USER_AGENT =
  "MapableAU-CareTransportEmployment/1.0 (accessible service booking)";

export async function geocodeAddress(
  address: string | null | undefined,
): Promise<GeocodeResult | null> {
  const q = address?.trim();
  if (!q || q.length < 3) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": NOMINATIM_USER_AGENT },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const rows = (await res.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;
  const first = rows[0];
  if (!first?.lat || !first.lon) return null;

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
    label: first.display_name ?? q,
  };
}
