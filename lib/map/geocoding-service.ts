export type GeocodeAddressInput = {
  query: string;
  limit?: number;
  country?: string;
};

export type GeocodeResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  provider: "nominatim";
  address: {
    suburb?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: {
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
    country?: string;
  };
};

export class GeocodingProviderError extends Error {
  constructor(message = "Geocoding provider unavailable") {
    super(message);
    this.name = "GeocodingProviderError";
  }
}

const DEFAULT_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const DEFAULT_USER_AGENT = "MapAbleAU-Geocoding/1.0 (accessibility platform)";

function geocodingEndpoint() {
  return process.env.MAPABLE_GEOCODING_ENDPOINT ?? DEFAULT_ENDPOINT;
}

function geocodingUserAgent() {
  return process.env.MAPABLE_GEOCODING_USER_AGENT ?? DEFAULT_USER_AGENT;
}

function normaliseCountry(country?: string) {
  return (country ?? "AU").trim().toLowerCase();
}

function parseCoordinate(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resultAddress(result: NominatimResult): GeocodeResult["address"] {
  const address = result.address ?? {};
  return {
    suburb: address.suburb ?? address.city ?? address.town ?? address.village,
    state: address.state,
    postcode: address.postcode,
    country: address.country_code?.toUpperCase() ?? address.country,
  };
}

function toGeocodeResult(result: NominatimResult): GeocodeResult | null {
  const latitude = parseCoordinate(result.lat);
  const longitude = parseCoordinate(result.lon);
  if (latitude == null || longitude == null || !result.display_name) {
    return null;
  }

  return {
    id: result.place_id ? `nominatim-${result.place_id}` : result.display_name,
    label: result.display_name,
    latitude,
    longitude,
    provider: "nominatim",
    address: resultAddress(result),
  };
}

export async function geocodeAddress({
  query,
  limit = 5,
  country = "AU",
}: GeocodeAddressInput): Promise<GeocodeResult[]> {
  const url = new URL(geocodingEndpoint());
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", String(limit));

  const countryCode = normaliseCountry(country);
  if (countryCode) {
    url.searchParams.set("countrycodes", countryCode);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": geocodingUserAgent(),
      },
    });
  } catch {
    throw new GeocodingProviderError();
  }

  if (!response.ok) {
    throw new GeocodingProviderError(
      `Geocoding provider returned ${response.status}`,
    );
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new GeocodingProviderError("Unexpected geocoding provider response");
  }

  return payload
    .map((result) => toGeocodeResult(result as NominatimResult))
    .filter((result): result is GeocodeResult => result != null);
}
