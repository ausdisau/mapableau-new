/** Amazon Location Service (geo-places) configuration for server-side geocoding. */

export type AmazonLocationConfig = {
  region: string;
  apiKey?: string;
  language: string;
  includeCountries: string[];
  /** Sydney CBD — bias AU address search [longitude, latitude]. */
  defaultBiasPosition: [number, number];
};

export function isAmazonLocationEnabled(): boolean {
  if (process.env.AMAZON_LOCATION_ENABLED !== "true") return false;
  if (process.env.AMAZON_LOCATION_API_KEY?.trim()) return true;
  if (process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim()) {
    return true;
  }
  return false;
}

export function getAmazonLocationConfig(): AmazonLocationConfig {
  const lng = Number(process.env.AMAZON_LOCATION_BIAS_LNG ?? "151.2093");
  const lat = Number(process.env.AMAZON_LOCATION_BIAS_LAT ?? "-33.8688");

  return {
    region: process.env.AMAZON_LOCATION_REGION ?? "ap-southeast-2",
    apiKey: process.env.AMAZON_LOCATION_API_KEY?.trim() || undefined,
    language: process.env.AMAZON_LOCATION_LANGUAGE ?? "en",
    includeCountries: (process.env.AMAZON_LOCATION_COUNTRIES ?? "AU")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    defaultBiasPosition: [lng, lat],
  };
}
