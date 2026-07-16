import { isTransperthAvailable, transperthConfig } from "@/lib/config/transperth";
import { createGtfsPtAdapter } from "@/lib/gtfs/adapter";
import { createGtfsCache } from "@/lib/gtfs/cache";
import { waNotConfiguredError } from "@/lib/public-transport/pt-api-error";
import { PT_DISCLAIMERS, PT_LINK_OUT } from "@/lib/public-transport/types";

const cache = createGtfsCache({
  gtfsUrls: [transperthConfig.gtfsUrl],
  refreshHours: transperthConfig.refreshHours,
});

export const transperthPtAdapter = createGtfsPtAdapter({
  jurisdiction: "WA",
  linkOutUrl: PT_LINK_OUT.WA,
  disclaimer: PT_DISCLAIMERS.WA,
  isAvailable: isTransperthAvailable,
  notConfiguredError: waNotConfiguredError,
  cache,
  disruptions: false,
});
