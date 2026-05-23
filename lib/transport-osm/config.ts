export const transportOsmConfig = {
  routingEnabled: process.env.TRANSPORT_ROUTING_ENABLED === "true",
  routeProvider: (process.env.ROUTE_PROVIDER ?? "disabled") as
    | "openrouteservice"
    | "valhalla"
    | "opentripplanner"
    | "disabled",
  orsApiKey: process.env.ORS_API_KEY ?? "",
  nominatimUserAgent:
    process.env.NOMINATIM_USER_AGENT ?? "MapAbleAU-Transport/1.0",
  mapStyleUrl:
    process.env.MAP_STYLE_URL ??
    "https://tiles.openfreemap.org/styles/liberty",
  quoteTtlMinutes: Number(process.env.TRANSPORT_QUOTE_TTL_MINUTES ?? "60"),
  boardingBufferMinutes: Number(
    process.env.TRANSPORT_BOARDING_BUFFER_MINUTES ?? "15"
  ),
  baseFareCents: Number(process.env.TRANSPORT_BASE_FARE_CENTS ?? "2500"),
  perKmCents: Number(process.env.TRANSPORT_PER_KM_CENTS ?? "180"),
};
