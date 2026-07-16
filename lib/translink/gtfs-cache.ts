import { translinkConfig, isTranslinkAvailable } from "@/lib/config/translink";
import { createGtfsCache } from "@/lib/gtfs/cache";
import { translinkNotConfiguredError } from "@/lib/public-transport/pt-api-error";

const cache = createGtfsCache({
  gtfsUrls: [translinkConfig.gtfsUrl],
  refreshHours: translinkConfig.refreshHours,
});

export async function getTranslinkGtfsIndex() {
  if (!isTranslinkAvailable()) throw translinkNotConfiguredError();
  return cache.getIndex();
}

export function clearTranslinkGtfsCache(): void {
  cache.clear();
}

export async function ensureTranslinkGtfsLoaded(): Promise<boolean> {
  if (!isTranslinkAvailable()) return false;
  return cache.ensureLoaded();
}

export { cache as translinkGtfsCache };
