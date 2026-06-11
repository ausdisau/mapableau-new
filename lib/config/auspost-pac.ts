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

/** Suburb/postcode autocomplete via PAC when a server-side API key is configured. */
export function isAuspostPacLocationSearchAvailable(): boolean {
  return isAuspostPacConfigured();
}
