import { translinkConfig, isTranslinkAvailable } from "@/lib/config/translink";
import { createGtfsPtAdapter } from "@/lib/gtfs/adapter";
import { createGtfsCache } from "@/lib/gtfs/cache";
import { createGtfsRealtimeService } from "@/lib/gtfs/realtime";
import { translinkNotConfiguredError } from "@/lib/public-transport/pt-api-error";
import { PT_DISCLAIMERS, PT_LINK_OUT } from "@/lib/public-transport/types";

const cache = createGtfsCache({
  gtfsUrls: [translinkConfig.gtfsUrl],
  refreshHours: translinkConfig.refreshHours,
});

const realtime = createGtfsRealtimeService({
  tripUpdatesUrl: translinkConfig.tripUpdatesUrl,
  alertsUrl: translinkConfig.alertsUrl,
  cacheTtlSeconds: translinkConfig.cacheTtlSeconds,
});

export const translinkPtAdapter = createGtfsPtAdapter({
  jurisdiction: "QLD",
  linkOutUrl: PT_LINK_OUT.QLD,
  disclaimer: PT_DISCLAIMERS.QLD,
  isAvailable: isTranslinkAvailable,
  notConfiguredError: translinkNotConfiguredError,
  cache,
  realtime,
  rssUrls: [
    translinkConfig.rssTrainUrl,
    translinkConfig.rssBusUrl,
    translinkConfig.rssFerryUrl,
    translinkConfig.rssTramUrl,
  ],
});
