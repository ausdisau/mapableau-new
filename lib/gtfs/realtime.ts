import GtfsRealtimeBindings from "gtfs-realtime-bindings";

export type TripDelayUpdate = {
  tripId: string;
  delaySeconds?: number;
  isCancelled?: boolean;
};

export type GtfsRtAlert = {
  id?: string;
  headline: string;
  description?: string;
};

export type GtfsRealtimeConfig = {
  tripUpdatesUrl: string;
  alertsUrl?: string | null;
  cacheTtlSeconds: number;
  fetchHeaders?: Record<string, string>;
  /** When false, omit Accept header (Adelaide Metro returns JSON with application/x-protobuf). */
  preferProtobufAccept?: boolean;
};

export function createGtfsRealtimeService(config: GtfsRealtimeConfig) {
  let cachedUpdates: { fetchedAt: number; updates: Map<string, TripDelayUpdate> } | null =
    null;

  function buildFetchHeaders(): Record<string, string> {
    const headers: Record<string, string> = { ...(config.fetchHeaders ?? {}) };
    if (config.preferProtobufAccept !== false) {
      headers.Accept = "application/x-protobuf";
    }
    return headers;
  }

  async function getTripDelayUpdates(): Promise<Map<string, TripDelayUpdate>> {
    const ttlMs = config.cacheTtlSeconds * 1000;
    if (cachedUpdates && Date.now() - cachedUpdates.fetchedAt < ttlMs) {
      return cachedUpdates.updates;
    }

    const updates = new Map<string, TripDelayUpdate>();

    try {
      const res = await fetch(config.tripUpdatesUrl, {
        headers: buildFetchHeaders(),
        next: { revalidate: config.cacheTtlSeconds },
      });
      if (!res.ok) return updates;

      const buffer = new Uint8Array(await res.arrayBuffer());
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

      for (const entity of feed.entity) {
        const tripUpdate = entity.tripUpdate;
        if (!tripUpdate?.trip?.tripId) continue;
        const tripId = tripUpdate.trip.tripId;
        let delaySeconds: number | undefined;
        const isCancelled = tripUpdate.trip.scheduleRelationship === 3;

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

  function clear(): void {
    cachedUpdates = null;
  }

  async function getGtfsRtAlerts(): Promise<GtfsRtAlert[]> {
    const url = config.alertsUrl;
    if (!url) return [];

    try {
      const res = await fetch(url, {
        headers: buildFetchHeaders(),
        next: { revalidate: config.cacheTtlSeconds },
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

  return { getTripDelayUpdates, getGtfsRtAlerts, clear };
}

export type GtfsRealtimeService = ReturnType<typeof createGtfsRealtimeService>;
