import { isPtvAvailable } from "@/lib/config/ptv";
import type { PtAdapter } from "@/lib/public-transport/pt-adapter";
import { ptTripPlanningNotSupported } from "@/lib/public-transport/pt-api-error";
import {
  PT_DISCLAIMERS,
  PT_LINK_OUT,
  type PtCapabilities,
  type PtPlanTripParams,
} from "@/lib/public-transport/types";
import { ptvNotConfiguredError } from "@/lib/ptv/client";
import {
  getDepartures as ptvGetDepartures,
  getDisruptions as ptvGetDisruptionsRaw,
  searchStops as ptvSearchStops,
  stopsNearCoord as ptvStopsNearCoord,
} from "@/lib/ptv/timetable-service";
import {
  parsePtvDepartures,
  parsePtvDisruptions,
  parsePtvNearbyStops,
  parsePtvSearchStops,
} from "@/lib/ptv/normalize";

const capabilities: PtCapabilities = {
  jurisdiction: "VIC",
  tripPlanning: false,
  stopSearch: true,
  departures: true,
  disruptions: true,
  wheelchairFilter: false,
  linkOutUrl: PT_LINK_OUT.VIC,
  disclaimer: PT_DISCLAIMERS.VIC,
};

function ensureAvailable() {
  if (!isPtvAvailable()) throw ptvNotConfiguredError();
}

export const ptvPtAdapter: PtAdapter = {
  jurisdiction: "VIC",
  capabilities,

  async searchStops(params) {
    ensureAvailable();
    const raw = await ptvSearchStops(params.query, params.maxResults);
    return parsePtvSearchStops(raw);
  },

  async stopsNearCoord(params) {
    ensureAvailable();
    const raw = await ptvStopsNearCoord(params);
    return parsePtvNearbyStops(raw);
  },

  async getDepartures(params) {
    ensureAvailable();
    const routeType = params.routeType ?? 0;
    const raw = await ptvGetDepartures({
      routeType,
      stopId: params.stopId,
      maxResults: params.maxResults,
    });
    return {
      stopId: params.stopId,
      departures: parsePtvDepartures(raw, params.stopId),
    };
  },

  async getDisruptions() {
    ensureAvailable();
    const raw = await ptvGetDisruptionsRaw();
    return parsePtvDisruptions(raw);
  },

  async planTrip(_params: PtPlanTripParams) {
    throw ptTripPlanningNotSupported("VIC", PT_LINK_OUT.VIC);
  },
};
