import { translinkConfig } from "@/lib/config/translink";
import { createGtfsRealtimeService } from "@/lib/gtfs/realtime";

const realtime = createGtfsRealtimeService({
  tripUpdatesUrl: translinkConfig.tripUpdatesUrl,
  alertsUrl: translinkConfig.alertsUrl,
  cacheTtlSeconds: translinkConfig.cacheTtlSeconds,
});

export type { TripDelayUpdate } from "@/lib/gtfs/realtime";

export async function getTripDelayUpdates() {
  return realtime.getTripDelayUpdates();
}

export async function getGtfsRtAlerts() {
  return realtime.getGtfsRtAlerts();
}

export function clearTranslinkRealtimeCache(): void {
  realtime.clear();
}
