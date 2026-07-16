import { isTasmaniaAvailable, tasmaniaConfig } from "@/lib/config/tasmania";
import { createGtfsPtAdapter } from "@/lib/gtfs/adapter";
import { createGtfsCache } from "@/lib/gtfs/cache";
import { tasNotConfiguredError } from "@/lib/public-transport/pt-api-error";
import { PT_DISCLAIMERS, PT_LINK_OUT } from "@/lib/public-transport/types";

const cache = createGtfsCache({
  gtfsUrls: [tasmaniaConfig.gtfsUrl],
  refreshHours: tasmaniaConfig.refreshHours,
});

export const tasmaniaPtAdapter = createGtfsPtAdapter({
  jurisdiction: "TAS",
  linkOutUrl: PT_LINK_OUT.TAS,
  disclaimer: PT_DISCLAIMERS.TAS,
  isAvailable: isTasmaniaAvailable,
  notConfiguredError: tasNotConfiguredError,
  cache,
  disruptions: false,
});
