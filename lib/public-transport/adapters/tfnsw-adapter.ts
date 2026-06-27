import { isTfnswTripPlannerAvailable } from "@/lib/config/tfnsw";
import type { PtAdapter } from "@/lib/public-transport/pt-adapter";
import {
  PT_DISCLAIMERS,
  PT_LINK_OUT,
  type PtCapabilities,
  type PtDeparturesParams,
  type PtPlanTripParams,
  type PtSearchStopsParams,
  type PtStopsNearCoordParams,
} from "@/lib/public-transport/types";
import { tfnswNotConfiguredError } from "@/lib/tfnsw/tfnsw-api-error";
import {
  findStops,
  getDeparturesAtStop,
  getServiceAlerts,
  getStopsNearCoordinate,
  planTrip,
  planTripFromCoordinates,
} from "@/lib/tfnsw/trip-planner-service";
import {
  parseTfnswCoordStops,
  parseTfnswDepartures,
  parseTfnswDisruptions,
  parseTfnswStops,
  parseTfnswTripPlan,
} from "@/lib/tfnsw/trip-planner-parse";

const capabilities: PtCapabilities = {
  jurisdiction: "NSW",
  tripPlanning: true,
  stopSearch: true,
  departures: true,
  disruptions: true,
  wheelchairFilter: true,
  linkOutUrl: PT_LINK_OUT.NSW,
  disclaimer: PT_DISCLAIMERS.NSW,
};

function ensureAvailable() {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();
}

export const tfnswPtAdapter: PtAdapter = {
  jurisdiction: "NSW",
  capabilities,

  async searchStops(params: PtSearchStopsParams) {
    ensureAvailable();
    const raw = await findStops(params);
    return parseTfnswStops(raw);
  },

  async stopsNearCoord(params: PtStopsNearCoordParams) {
    ensureAvailable();
    const raw = await getStopsNearCoordinate(params);
    return parseTfnswCoordStops(raw);
  },

  async getDepartures(params: PtDeparturesParams) {
    ensureAvailable();
    const raw = await getDeparturesAtStop({
      stopId: params.stopId,
      itdDate: params.itdDate,
      itdTime: params.itdTime,
      platformId: params.platformId,
    });
    return {
      stopId: params.stopId,
      departures: parseTfnswDepartures(raw, params.stopId),
    };
  },

  async getDisruptions() {
    ensureAvailable();
    const raw = await getServiceAlerts();
    return parseTfnswDisruptions(raw);
  },

  async planTrip(params: PtPlanTripParams) {
    ensureAvailable();

    let raw: unknown;
    if (params.origin && params.destination && !params.originStopId) {
      raw = await planTripFromCoordinates({
        origin: params.origin,
        destination: params.destination,
        depArrMacro: params.depArrMacro,
        itdDate: params.itdDate,
        itdTime: params.itdTime,
        maxTrips: params.maxTrips,
        wheelchair: params.wheelchair,
      });
    } else if (params.originStopId && params.destinationStopId) {
      raw = await planTrip({
        typeOrigin: "any",
        nameOrigin: params.originStopId,
        typeDestination: "any",
        nameDestination: params.destinationStopId,
        depArrMacro: params.depArrMacro,
        itdDate: params.itdDate,
        itdTime: params.itdTime,
        maxTrips: params.maxTrips,
        wheelchair: params.wheelchair,
      });
    } else {
      throw tfnswNotConfiguredError();
    }

    return parseTfnswTripPlan(raw);
  },
};
