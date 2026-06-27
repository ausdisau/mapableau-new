import GtfsRealtimeBindings from "gtfs-realtime-bindings";

import { translinkConfig } from "@/lib/config/translink";

export type TripDelayUpdate = {
  tripId: string;
  delaySeconds?: number;
  isCancelled?: boolean;
};

let cachedUpdates: { fetchedAt: number; updates: Map<string, TripDelayUpdate> } | null =
  null;

export async function getTripDelayUpdates(): Promise<Map<string, TripDelayUpdate>> {
  const ttlMs = translinkConfig.cacheTtlSeconds * 1000;
  if (cachedUpdates && Date.now() - cachedUpdates.fetchedAt < ttlMs) {
    return cachedUpdates.updates;
  }

  const updates = new Map<string, TripDelayUpdate>();

  try {
    const res = await fetch(translinkConfig.tripUpdatesUrl, {
      headers: { Accept: "application/x-protobuf" },
      next: { revalidate: translinkConfig.cacheTtlSeconds },
    });
    if (!res.ok) return updates;

    const buffer = new Uint8Array(await res.arrayBuffer());
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    for (const entity of feed.entity) {
      const tripUpdate = entity.tripUpdate;
      if (!tripUpdate?.trip?.tripId) continue;
      const tripId = tripUpdate.trip.tripId;
      let delaySeconds: number | undefined;
      let isCancelled = tripUpdate.trip.scheduleRelationship === 3;

      for (const stu of tripUpdate.stopTimeUpdate ?? []) {
        if (stu.departure?.delay != null) delaySeconds = stu.departure.delay;
        if (stu.arrival?.delay != null) delaySeconds = stu.arrival.delay;
      }

      updates.set(tripId, { tripId, delaySeconds, isCancelled });
    }
  } catch {
    // Realtime is best-effort
  }

  cachedUpdates = { fetchedAt: Date.now(), updates };
  return updates;
}

export function clearTranslinkRealtimeCache(): void {
  cachedUpdates = null;
}

export async function getGtfsRtAlerts(): Promise<
  Array<{ id?: string; headline: string; description?: string }>
> {
  const url = translinkConfig.alertsUrl;
  if (!url) return [];

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/x-protobuf" },
      next: { revalidate: translinkConfig.cacheTtlSeconds },
    });
    if (!res.ok) return [];

    const buffer = new Uint8Array(await res.arrayBuffer());
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    return feed.entity
      .filter((e) => e.alert)
      .map((e) => ({
        id: e.id,
        headline:
          e.alert?.headerText?.translation?.[0]?.text ??
          e.alert?.descriptionText?.translation?.[0]?.text ??
          "Service alert",
        description: e.alert?.descriptionText?.translation?.[0]?.text,
      }));
  } catch {
    return [];
  }
}
