import { getGoogleMapsApiKey, getGoogleMapsRegion } from "@/lib/geocoding/google-config";

export type GeocodeResult = {
  lat: number;
  lng: number;
  postcode: string;
  suburb: string;
  state: string;
  displayName: string;
};

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResponse = {
  status: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    address_components?: GoogleAddressComponent[];
  }>;
};

function parseAddressComponents(components: GoogleAddressComponent[] = []) {
  let postcode = "";
  let suburb = "";
  let state = "";

  for (const c of components) {
    if (c.types.includes("postal_code")) postcode = c.long_name;
    if (
      c.types.includes("locality") ||
      c.types.includes("postal_town") ||
      c.types.includes("sublocality")
    ) {
      if (!suburb) suburb = c.long_name;
    }
    if (c.types.includes("administrative_area_level_1")) {
      state = c.short_name || c.long_name;
    }
  }

  return { postcode, suburb, state };
}

async function geocodeRequest(params: URLSearchParams): Promise<GeocodeResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  params.set("key", apiKey);
  params.set("region", getGoogleMapsRegion());

  const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error("[google-geocoding] request failed", res.status);
    return null;
  }

  const data = (await res.json()) as GoogleGeocodeResponse;
  if (data.status !== "OK" || !data.results?.length) {
    return null;
  }

  const first = data.results[0];
  const lat = first.geometry?.location?.lat;
  const lng = first.geometry?.location?.lng;
  if (lat == null || lng == null) return null;

  const { postcode, suburb, state } = parseAddressComponents(
    first.address_components,
  );

  return {
    lat,
    lng,
    postcode,
    suburb,
    state,
    displayName: first.formatted_address ?? "",
  };
}

/** Reverse geocode lat/lng via Google Geocoding API. */
export async function googleReverseGeocode(
  lat: number,
  lng: number,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
  });
  return geocodeRequest(params);
}

/** Forward geocode suburb/postcode/address string (biased to AU). */
export async function googleForwardGeocode(
  address: string,
): Promise<GeocodeResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const params = new URLSearchParams({
    address: trimmed,
    components: `country:${getGoogleMapsRegion().toUpperCase()}`,
  });
  return geocodeRequest(params);
}

/** Lightweight health check — geocode a known AU landmark. */
export async function pingGoogleGeocoding(): Promise<{
  ok: boolean;
  message: string;
}> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return { ok: false, message: "GOOGLE_MAPS_API_KEY not set" };
  }

  const params = new URLSearchParams({
    address: "Sydney NSW Australia",
    components: "country:AU",
    key: apiKey,
  });

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    );
    if (!res.ok) {
      return { ok: false, message: `Geocoding API returned ${res.status}` };
    }
    const data = (await res.json()) as GoogleGeocodeResponse;
    if (data.status === "OK") {
      return { ok: true, message: "Geocoding API reachable" };
    }
    return { ok: false, message: `Geocoding status: ${data.status}` };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Geocoding ping failed",
    };
  }
}
