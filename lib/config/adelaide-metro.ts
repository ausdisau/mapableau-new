/**
 * Adelaide Metro (SA) GTFS / GTFS-RT configuration.
 * https://www.adelaidemetro.com.au/developer-info
 */
export const adelaideMetroConfig = {
  get enabled() {
    return process.env.SA_GTFS_ENABLED !== "false";
  },
  get gtfsUrl() {
    return (
      process.env.SA_GTFS_URL ??
      "https://gtfs.adelaidemetro.com.au/v1/static/latest/google_transit.zip"
    );
  },
  get tripUpdatesUrl() {
    return (
      process.env.SA_GTFSRT_TRIP_UPDATES_URL ??
      "https://gtfs.adelaidemetro.com.au/v1/realtime/trip_updates"
    );
  },
  get alertsUrl() {
    return (
      process.env.SA_GTFSRT_ALERTS_URL ??
      "https://gtfs.adelaidemetro.com.au/v1/realtime/service_alerts"
    );
  },
  get refreshHours() {
    return Number(process.env.SA_GTFS_REFRESH_HOURS ?? "24");
  },
  get cacheTtlSeconds() {
    return Number(process.env.SA_CACHE_TTL_SECONDS ?? "120");
  },
};

export function isAdelaideMetroAvailable(): boolean {
  return adelaideMetroConfig.enabled;
}
