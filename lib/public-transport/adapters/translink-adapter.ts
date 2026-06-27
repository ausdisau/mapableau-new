import { translinkConfig, isTranslinkAvailable } from "@/lib/config/translink";
import type { PtAdapter } from "@/lib/public-transport/pt-adapter";
import { ptTripPlanningNotSupported, translinkNotConfiguredError } from "@/lib/public-transport/pt-api-error";
import {
  PT_DISCLAIMERS,
  PT_LINK_OUT,
  type PtCapabilities,
  type PtDeparture,
  type PtPlanTripParams,
  type PtStop,
} from "@/lib/public-transport/types";
import { getTranslinkGtfsIndex } from "@/lib/translink/gtfs-cache";
import {
  nextDeparturesFromIndex,
  searchStopsInIndex,
  stopsNearCoordInIndex,
} from "@/lib/translink/gtfs-index";
import { getGtfsRtAlerts, getTripDelayUpdates } from "@/lib/translink/realtime-service";
import { fetchAllTranslinkRssDisruptions } from "@/lib/translink/rss-service";

const capabilities: PtCapabilities = {
  jurisdiction: "QLD",
  tripPlanning: false,
  stopSearch: true,
  departures: true,
  disruptions: true,
  wheelchairFilter: false,
  linkOutUrl: PT_LINK_OUT.QLD,
  disclaimer: PT_DISCLAIMERS.QLD,
};

function ensureAvailable() {
  if (!isTranslinkAvailable()) throw translinkNotConfiguredError();
}

function gtfsStopToPtStop(
  stop: { stop_id: string; stop_name: string; stop_lat: number; stop_lon: number; wheelchair_boarding?: string; distanceMetres?: number }
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

export const translinkPtAdapter: PtAdapter = {
  jurisdiction: "QLD",
  capabilities,

  async searchStops(params) {
    ensureAvailable();
    const index = await getTranslinkGtfsIndex();
    return searchStopsInIndex(index, params.query, params.maxResults ?? 10).map(gtfsStopToPtStop);
  },

  async stopsNearCoord(params) {
    ensureAvailable();
    const index = await getTranslinkGtfsIndex();
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
    const index = await getTranslinkGtfsIndex();
    const scheduled = nextDeparturesFromIndex(
      index,
      params.stopId,
      params.maxResults ?? 10
    );
    const rtUpdates = await getTripDelayUpdates();

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
    const rssUrls = [
      translinkConfig.rssTrainUrl,
      translinkConfig.rssBusUrl,
      translinkConfig.rssFerryUrl,
      translinkConfig.rssTramUrl,
    ];
    const rss = await fetchAllTranslinkRssDisruptions(rssUrls);
    const rtAlerts = await getGtfsRtAlerts();
    const fromRt = rtAlerts.map((a) => ({
      id: a.id,
      headline: a.headline,
      description: a.description,
      status: "current",
    }));
    return [...rss, ...fromRt].slice(0, 50);
  },

  async planTrip(_params: PtPlanTripParams) {
    throw ptTripPlanningNotSupported("QLD", PT_LINK_OUT.QLD);
  },
};
