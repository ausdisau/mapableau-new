/** Server-side Google Maps / Places / Geocoding configuration. */

export function isGoogleMapsEnabled(): boolean {
  return process.env.GOOGLE_MAPS_ENABLED === "true";
}

export function getGoogleMapsApiKey(): string | undefined {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return key || undefined;
}

export function isGoogleMapsConfigured(): boolean {
  return isGoogleMapsEnabled() && Boolean(getGoogleMapsApiKey());
}

/** CLDR region code for biasing and restrictions (default Australia). */
export function getGoogleMapsRegion(): string {
  return (process.env.GOOGLE_MAPS_REGION?.trim() || "au").toLowerCase();
}

/** Client-safe flag — set NEXT_PUBLIC_GOOGLE_MAPS_ENABLED=true when Google is on. */
export function isGoogleMapsPublicEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_ENABLED === "true";
}
