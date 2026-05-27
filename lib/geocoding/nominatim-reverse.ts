import type { GeocodeResult } from "@/lib/geocoding/google-geocoding-client";

const NOMINATIM_USER_AGENT = "MapableAU-ProviderFinder/1.0 (NDIS provider finder)";

/** Reverse geocode via Nominatim (OpenStreetMap). Server-side only. */
export async function nominatimReverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": NOMINATIM_USER_AGENT },
  });

  if (!res.ok) {
    return null;
  }

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
  const suburb =
    addr.suburb ?? addr.village ?? addr.town ?? addr.state_district ?? "";

  return {
    lat,
    lng,
    postcode: addr.postcode ?? "",
    suburb,
    state: addr.state ?? "",
    displayName: data.display_name ?? "",
  };
}
