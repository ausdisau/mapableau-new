/**
 * Translink Queensland GTFS / GTFS-RT / RSS open data configuration.
 * https://translink.com.au/about-translink/open-data
 */
export const translinkConfig = {
  get enabled() {
    return process.env.TRANSLINK_GTFS_ENABLED !== "false";
  },
  get gtfsUrl() {
    return (
      process.env.TRANSLINK_GTFS_URL ??
      "https://gtfsrt.api.translink.com.au/GTFS/SEQ_GTFS.zip"
    );
  },
  get refreshHours() {
    return Number(process.env.TRANSLINK_GTFS_REFRESH_HOURS ?? "24");
  },
  get tripUpdatesUrl() {
    return (
      process.env.TRANSLINK_GTFSRT_TRIP_UPDATES_URL ??
      "https://gtfsrt.api.translink.com.au/api/realtime/SEQ/TripUpdates"
    );
  },
  get alertsUrl() {
    return process.env.TRANSLINK_GTFSRT_ALERTS_URL?.trim() || null;
  },
  get rssTrainUrl() {
    return (
      process.env.TRANSLINK_RSS_TRAIN_URL ??
      "https://translink.com.au/feeds/service-notices/train"
    );
  },
  get rssBusUrl() {
    return (
      process.env.TRANSLINK_RSS_BUS_URL ??
      "https://translink.com.au/feeds/service-notices/bus"
    );
  },
  get rssFerryUrl() {
    return (
      process.env.TRANSLINK_RSS_FERRY_URL ??
      "https://translink.com.au/feeds/service-notices/ferry"
    );
  },
  get rssTramUrl() {
    return (
      process.env.TRANSLINK_RSS_TRAM_URL ??
      "https://translink.com.au/feeds/service-notices/tram"
    );
  },
  get cacheTtlSeconds() {
    return Number(process.env.TRANSLINK_CACHE_TTL_SECONDS ?? "120");
  },
};

export function isTranslinkAvailable(): boolean {
  return translinkConfig.enabled;
}
