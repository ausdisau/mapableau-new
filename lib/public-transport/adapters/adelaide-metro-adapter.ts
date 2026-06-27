import { adelaideMetroConfig, isAdelaideMetroAvailable } from "@/lib/config/adelaide-metro";
import { createGtfsPtAdapter } from "@/lib/gtfs/adapter";
import { createGtfsCache } from "@/lib/gtfs/cache";
import { createGtfsRealtimeService } from "@/lib/gtfs/realtime";
import { saNotConfiguredError } from "@/lib/public-transport/pt-api-error";
import { PT_DISCLAIMERS, PT_LINK_OUT } from "@/lib/public-transport/types";

const cache = createGtfsCache({
  gtfsUrls: [adelaideMetroConfig.gtfsUrl],
  refreshHours: adelaideMetroConfig.refreshHours,
});

const realtime = createGtfsRealtimeService({
  tripUpdatesUrl: adelaideMetroConfig.tripUpdatesUrl,
  alertsUrl: adelaideMetroConfig.alertsUrl,
  cacheTtlSeconds: adelaideMetroConfig.cacheTtlSeconds,
  preferProtobufAccept: false,
});

export const adelaideMetroPtAdapter = createGtfsPtAdapter({
  jurisdiction: "SA",
  linkOutUrl: PT_LINK_OUT.SA,
  disclaimer: PT_DISCLAIMERS.SA,
  isAvailable: isAdelaideMetroAvailable,
  notConfiguredError: saNotConfiguredError,
  cache,
  realtime,
});
