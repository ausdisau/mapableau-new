function envApiKey(): string | undefined {
  return process.env.AUSPOST_PAC_API_KEY ?? process.env.AUSPOST_API_KEY;
}

export const auspostPacConfig = {
  get apiKey() {
    return envApiKey();
  },
  get baseUrl() {
    return (
      process.env.AUSPOST_PAC_API_BASE_URL?.replace(/\/$/, "") ??
      "https://digitalapi.auspost.com.au"
    );
  },
  get enabled() {
    return process.env.AUSPOST_PAC_ENABLED !== "false";
  },
  get enrichLocationSearch() {
    return process.env.AUSPOST_PAC_ENRICH_LOCATION_SEARCH === "true";
  },
  get defaultFromPostcode() {
    return process.env.AUSPOST_PAC_DEFAULT_FROM_POSTCODE?.trim() || undefined;
  },
  get cacheTtlSeconds() {
    return Number(process.env.AUSPOST_PAC_CACHE_TTL_SECONDS ?? "3600");
  },
};

export function isAuspostPacConfigured(): boolean {
  return auspostPacConfig.enabled && Boolean(envApiKey()?.trim());
}

export function isAuspostPacLocationSearchAvailable(): boolean {
  return isAuspostPacConfigured() && auspostPacConfig.enrichLocationSearch;
}
