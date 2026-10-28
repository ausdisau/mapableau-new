/**
 * Server-side OpenTripMap adapter. Never import this module from a client
 * component. API credentials and licence controls are server-only.
 */
import { normaliseOpenTripMapPlaces, type OpenTripMapKind, type OpenTripMapPlace } from "@/lib/tourism/open-trip-map";

export class OpenTripMapUnavailable extends Error {
  constructor(public readonly kind: "rate_limit" | "upstream" | "invalid_data") {
    super("The tourism place feed is currently unavailable.");
  }
}

export async function searchSydneyOpenTripMapPlaces({
  query,
  kind,
}: {
  query: string;
  kind: OpenTripMapKind;
}): Promise<OpenTripMapPlace[]> {
  const key = process.env.OPENTRIPMAP_API_KEY;
  if (process.env.OPENTRIPMAP_ENABLED !== "true" || !key) {
    throw new OpenTripMapUnavailable("upstream");
  }

  const path = query ? "autosuggest" : "radius";
  const url = new URL("https://api.opentripmap.com/0.1/en/places/" + path);
  url.searchParams.set("radius", "7000");
  url.searchParams.set("lon", "151.2093");
  url.searchParams.set("lat", "-33.8688");
  url.searchParams.set("kinds", kind);
  url.searchParams.set("limit", "30");
  url.searchParams.set("format", "json");
  if (query) url.searchParams.set("name", query);
  if (!query) url.searchParams.set("rate", "2");
  url.searchParams.set("apikey", key);

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });
    if (response.status === 429) throw new OpenTripMapUnavailable("rate_limit");
    if (!response.ok) throw new OpenTripMapUnavailable("upstream");
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new OpenTripMapUnavailable("invalid_data");
    }
    try {
      return normaliseOpenTripMapPlaces(data, new Date().toISOString());
    } catch {
      throw new OpenTripMapUnavailable("invalid_data");
    }
  } catch (error) {
    if (error instanceof OpenTripMapUnavailable) throw error;
    // Don't print the URL (it contains an API key) or upstream response body.
    throw new OpenTripMapUnavailable("upstream");
  }
}
