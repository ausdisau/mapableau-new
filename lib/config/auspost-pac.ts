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
  get cacheTtlSeconds() {
    return Number(process.env.AUSPOST_PAC_CACHE_TTL_SECONDS ?? "3600");
  },
};

export function isAuspostPacConfigured(): boolean {
  return auspostPacConfig.enabled && Boolean(envApiKey()?.trim());
}

/** Suburb/postcode autocomplete via PAC postcode search (opt-out with =false). */
export function isAuspostPacLocationSearchAvailable(): boolean {
  if (!isAuspostPacConfigured()) return false;
  return process.env.AUSPOST_PAC_ENRICH_LOCATION_SEARCH !== "false";
}
