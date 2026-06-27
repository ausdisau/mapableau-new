/**
 * ACT Transport Canberra GTFS / GTFS-RT configuration.
 * https://anypoint.mulesoft.com/exchange/portals/act-government-9/
 */
import { basicAuthHeader } from "@/lib/gtfs/auth";

export const actConfig = {
  get enabled() {
    return process.env.ACT_GTFS_ENABLED !== "false";
  },
  get accessKey() {
    return process.env.ACT_GTFS_ACCESS_KEY?.trim() ?? "";
  },
  get gtfsUrl() {
    return (
      process.env.ACT_GTFS_URL ??
      "https://transport.api.act.gov.au/gtfs/data/gtfs/v2/google_transit.zip"
    );
  },
  get tripUpdatesUrl() {
    return (
      process.env.ACT_GTFSRT_TRIP_UPDATES_URL ??
      "https://transport.api.act.gov.au/gtfs/data/gtfs/v2/trip-updates.pb"
    );
  },
  get alertsUrl() {
    return (
      process.env.ACT_GTFSRT_ALERTS_URL ??
      "https://transport.api.act.gov.au/gtfs/data/gtfs/v2/service-alerts.pb"
    );
  },
  get refreshHours() {
    return Number(process.env.ACT_GTFS_REFRESH_HOURS ?? "24");
  },
  get cacheTtlSeconds() {
    return Number(process.env.ACT_CACHE_TTL_SECONDS ?? "120");
  },
  get fetchHeaders(): Record<string, string> | undefined {
    if (!this.accessKey) return undefined;
    return basicAuthHeader("", this.accessKey);
  },
};

export function isActAvailable(): boolean {
  return actConfig.enabled && actConfig.accessKey.length > 0;
}
