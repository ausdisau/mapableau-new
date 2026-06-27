/**
 * Public Transport Victoria Timetable API v3 configuration.
 * Register: APIKeyRequest@ptv.vic.gov.au
 */
export const ptvConfig = {
  get devId() {
    return process.env.PTV_DEV_ID?.trim();
  },
  get apiKey() {
    return process.env.PTV_API_KEY?.trim();
  },
  get baseUrl() {
    return (
      process.env.PTV_API_BASE_URL?.replace(/\/$/, "") ??
      "https://timetableapi.ptv.vic.gov.au"
    );
  },
  get enabled() {
    return process.env.PTV_TIMETABLE_ENABLED !== "false";
  },
  get cacheTtlSeconds() {
    return Number(process.env.PTV_CACHE_TTL_SECONDS ?? "120");
  },
};

export function isPtvConfigured(): boolean {
  return Boolean(ptvConfig.devId && ptvConfig.apiKey);
}

export function isPtvAvailable(): boolean {
  return ptvConfig.enabled && isPtvConfigured();
}
