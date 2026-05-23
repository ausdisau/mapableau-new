export const schedulingConfig = {
  orsApiKey: process.env.ORS_API_KEY ?? "",
  orsBaseUrl:
    process.env.ORS_BASE_URL ?? "https://api.openrouteservice.org",
  routingProvider: process.env.ROUTING_PROVIDER ?? "openrouteservice",
  schedulingEngine: process.env.SCHEDULING_ENGINE ?? "heuristic",
  postgisEnabled: process.env.POSTGIS_ENABLED !== "false",
  geocodingProvider: process.env.GEOCODING_PROVIDER ?? "internal_rounded",
  coordinatePrecision: Number(process.env.COORDINATE_PRECISION ?? "5"),
  matrixCacheTtlMinutes: Number(process.env.MATRIX_CACHE_TTL_MINUTES ?? "60"),
  schedulingEnabled: process.env.SCHEDULING_ENABLED !== "false",
};

export function isOrsConfigured() {
  return Boolean(schedulingConfig.orsApiKey);
}
