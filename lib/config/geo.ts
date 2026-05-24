export const geoConfig = {
  geocodingEnabled: process.env.GEOCODING_ENABLED !== "false",
  geocodingProvider: process.env.GEOCODING_PROVIDER ?? "nominatim",
  nominatimBaseUrl:
    process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org",
  postgisEnabled: process.env.POSTGIS_ENABLED !== "false",
  maplibreEnabled: process.env.MAPLIBRE_ENABLED === "true",
  maplibreStyleUrl:
    process.env.MAPLIBRE_STYLE_URL ??
    "https://demotiles.maplibre.org/style.json",
  routeOptimisationEnabled:
    process.env.ROUTE_OPTIMISATION_ENABLED === "true",
  liveTrackingEnabled: process.env.TRANSPORT_LIVE_TRACKING_ENABLED === "true",
};
