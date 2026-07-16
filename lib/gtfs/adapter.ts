import type { GtfsCache } from "@/lib/gtfs/cache";
import type { GtfsRealtimeService } from "@/lib/gtfs/realtime";
import { fetchAllRssDisruptions } from "@/lib/gtfs/rss";
import {
  nextDeparturesFromIndex,
  searchStopsInIndex,
  stopsNearCoordInIndex,
} from "@/lib/gtfs/index";
import type { PtAdapter } from "@/lib/public-transport/pt-adapter";
import { ptTripPlanningNotSupported } from "@/lib/public-transport/pt-api-error";
import type { PtCapabilities, PtDeparture, PtJurisdiction, PtStop } from "@/lib/public-transport/types";
import { TransportApiError } from "@/lib/transport/transport-api-error";

export type GtfsPtAdapterOptions = {
  jurisdiction: PtJurisdiction;
  linkOutUrl: string;
  disclaimer: string;
  isAvailable: () => boolean;
  notConfiguredError: () => TransportApiError;
  cache: GtfsCache;
  realtime?: GtfsRealtimeService;
  rssUrls?: string[];
  disruptions?: boolean;
};

function gtfsStopToPtStop(
  stop: {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
    wheelchair_boarding?: string;
    distanceMetres?: number;
  }
): PtStop {
  return {
    id: stop.stop_id,
    name: stop.stop_name,
    lat: stop.stop_lat,
    lng: stop.stop_lon,
    distanceMetres: stop.distanceMetres,
    wheelchairAccessible:
      stop.wheelchair_boarding === "1"
        ? true
        : stop.wheelchair_boarding === "2"
          ? false
          : null,
  };
}

export function createGtfsPtAdapter(options: GtfsPtAdapterOptions): PtAdapter {
  const hasRealtime = options.realtime != null;
  const hasDisruptions =
    options.disruptions !== false &&
    (hasRealtime || (options.rssUrls?.length ?? 0) > 0);

  const capabilities: PtCapabilities = {
    jurisdiction: options.jurisdiction,
    tripPlanning: false,
    stopSearch: true,
    departures: true,
    disruptions: hasDisruptions,
    wheelchairFilter: false,
    linkOutUrl: options.linkOutUrl,
    disclaimer: options.disclaimer,
  };

  function ensureAvailable() {
    if (!options.isAvailable()) throw options.notConfiguredError();
  }

  return {
    jurisdiction: options.jurisdiction,
    capabilities,

    async searchStops(params) {
      ensureAvailable();
      const index = await options.cache.getIndex();
      return searchStopsInIndex(index, params.query, params.maxResults ?? 10).map(gtfsStopToPtStop);
    },

    async stopsNearCoord(params) {
      ensureAvailable();
      const index = await options.cache.getIndex();
      return stopsNearCoordInIndex(
        index,
        params.lat,
        params.lng,
        params.radiusMetres ?? 500,
        params.maxResults ?? 10
      ).map(gtfsStopToPtStop);
    },

    async getDepartures(params) {
      ensureAvailable();
      const index = await options.cache.getIndex();
      const scheduled = nextDeparturesFromIndex(
        index,
        params.stopId,
        params.maxResults ?? 10
      );
      const rtUpdates = hasRealtime
        ? await options.realtime!.getTripDelayUpdates()
        : new Map();

      const departures: PtDeparture[] = scheduled.map((d) => {
        const rt = rtUpdates.get(d.tripId);
        return {
          stopId: params.stopId,
          routeNumber: d.routeNumber,
          destination: d.destination,
          scheduledTime: d.departureTime,
          isCancelled: rt?.isCancelled,
          mode: d.mode,
        };
      });

      return { stopId: params.stopId, departures };
    },

    async getDisruptions() {
      ensureAvailable();
      if (!hasDisruptions) return [];

      const rss =
        options.rssUrls && options.rssUrls.length > 0
          ? await fetchAllRssDisruptions(options.rssUrls)
          : [];
      const rtAlerts = hasRealtime ? await options.realtime!.getGtfsRtAlerts() : [];
      const fromRt = rtAlerts.map((a) => ({
        id: a.id,
        headline: a.headline,
        description: a.description,
        status: "current",
      }));
      return [...rss, ...fromRt].slice(0, 50);
    },

    async planTrip(_params) {
      throw ptTripPlanningNotSupported(options.jurisdiction, options.linkOutUrl);
    },
  };
}
