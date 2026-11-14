/**
 * Geoscape Predictive configuration (server-side only).
 * Never expose GEOSCAPE_API_KEY via NEXT_PUBLIC_* or client bundles.
 * Opt-in: GEOSCAPE_PREDICTIVE_ENABLED must be exactly "true".
 */

function envApiKey(): string | undefined {
  return process.env.GEOSCAPE_API_KEY ?? process.env.GEOSCAPE_PREDICTIVE_API_KEY;
}

function isPredictiveEnabled(): boolean {
  return process.env.GEOSCAPE_PREDICTIVE_ENABLED === "true";
}

export const geoscapePredictiveConfig = {
  get apiKey() {
    return envApiKey();
  },
  get baseUrl() {
    return (
      process.env.GEOSCAPE_PREDICTIVE_BASE_URL?.replace(/\/$/, "") ??
      "https://api.psma.com.au/v1"
    );
  },
  get enabled() {
    return isPredictiveEnabled();
  },
  get cacheTtlSeconds() {
    return Number(process.env.GEOSCAPE_PREDICTIVE_CACHE_TTL_SECONDS ?? "300");
  },
  /** Geoscape requires at least 3 characters for useful street suggestions. */
  get minQueryLength() {
    return Number(process.env.GEOSCAPE_PREDICTIVE_MIN_QUERY_LENGTH ?? "3");
  },
  get dataset() {
    return process.env.GEOSCAPE_PREDICTIVE_DATASET?.trim() || "gnaf";
  },
};

export function isGeoscapePredictiveConfigured(): boolean {
  return geoscapePredictiveConfig.enabled && Boolean(envApiKey()?.trim());
}

/** Street address autocomplete via Geoscape Predictive when a server-side API key is set. */
export function isGeoscapeStreetSearchAvailable(): boolean {
  return isGeoscapePredictiveConfigured();
}

/** Non-secret env visibility for production troubleshooting (no key values). */
export function getGeoscapePredictiveDiagnostics() {
  const key = process.env.GEOSCAPE_API_KEY;
  const aliasKey = process.env.GEOSCAPE_PREDICTIVE_API_KEY;
  const keyTrimmed = key?.trim() ?? "";
  const aliasTrimmed = aliasKey?.trim() ?? "";
  const enabled = isPredictiveEnabled();

  return {
    geoscapeEnabled: enabled,
    geoscapeApiKeyDefined: key !== undefined,
    geoscapeApiKeyPresent: keyTrimmed.length > 0,
    geoscapeApiKeyLength: keyTrimmed.length,
    geoscapeApiKeyAliasDefined: aliasKey !== undefined,
    geoscapeApiKeyAliasPresent: aliasTrimmed.length > 0,
    geoscapeConfigured: isGeoscapePredictiveConfigured(),
    geoscapeStreetSearch: isGeoscapeStreetSearchAvailable(),
    baseUrl: geoscapePredictiveConfig.baseUrl,
  };
}
