import { isNtTransportAvailable, ntTransportConfig } from "@/lib/config/nt-transport";
import { createGtfsPtAdapter } from "@/lib/gtfs/adapter";
import { createGtfsCache } from "@/lib/gtfs/cache";
import { ntNotConfiguredError } from "@/lib/public-transport/pt-api-error";
import { PT_DISCLAIMERS, PT_LINK_OUT } from "@/lib/public-transport/types";

const cache = createGtfsCache({
  gtfsUrls: ntTransportConfig.gtfsUrls,
  refreshHours: ntTransportConfig.refreshHours,
});

export const ntTransportPtAdapter = createGtfsPtAdapter({
  jurisdiction: "NT",
  linkOutUrl: PT_LINK_OUT.NT,
  disclaimer: PT_DISCLAIMERS.NT,
  isAvailable: isNtTransportAvailable,
  notConfiguredError: ntNotConfiguredError,
  cache,
  disruptions: false,
});
