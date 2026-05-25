/**
 * Mapbox Geocoding — server-side only. Never expose MAPBOX_ACCESS_TOKEN to the client.
 */

export function getMapboxAccessToken(): string | undefined {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  return token && token.length > 0 ? token : undefined;
}

/** When false, falls back to local searchable_locations + Nominatim reverse. */
export function isMapboxGeocodingEnabled(): boolean {
  if (process.env.MAPBOX_GEOCODING_ENABLED === "false") return false;
  return Boolean(getMapboxAccessToken());
}

/** ISO 3166 alpha-2 country filter (Mapbox `country` param). */
export function getMapboxCountryCode(): string {
  return (process.env.MAPBOX_GEOCODING_COUNTRY ?? "au").trim().toLowerCase() || "au";
}

export const MAPBOX_GEOCODING_BASE = "https://api.mapbox.com/geocoding/v5/mapbox.places";
