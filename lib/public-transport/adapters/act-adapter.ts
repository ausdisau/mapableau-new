import { actConfig, isActAvailable } from "@/lib/config/act";
import { createGtfsPtAdapter } from "@/lib/gtfs/adapter";
import { createGtfsCache } from "@/lib/gtfs/cache";
import { createGtfsRealtimeService } from "@/lib/gtfs/realtime";
import { actNotConfiguredError } from "@/lib/public-transport/pt-api-error";
import { PT_DISCLAIMERS, PT_LINK_OUT } from "@/lib/public-transport/types";

const cache = createGtfsCache({
  gtfsUrls: [actConfig.gtfsUrl],
  refreshHours: actConfig.refreshHours,
  fetchHeaders: actConfig.fetchHeaders,
});

const realtime = createGtfsRealtimeService({
  tripUpdatesUrl: actConfig.tripUpdatesUrl,
  alertsUrl: actConfig.alertsUrl,
  cacheTtlSeconds: actConfig.cacheTtlSeconds,
  fetchHeaders: actConfig.fetchHeaders,
});

export const actPtAdapter = createGtfsPtAdapter({
  jurisdiction: "ACT",
  linkOutUrl: PT_LINK_OUT.ACT,
  disclaimer: PT_DISCLAIMERS.ACT,
  isAvailable: isActAvailable,
  notConfiguredError: actNotConfiguredError,
  cache,
  realtime,
});
