import type {
  PtCapabilities,
  PtDeparturesParams,
  PtDisruption,
  PtJurisdiction,
  PtPlanTripParams,
  PtSearchStopsParams,
  PtStop,
  PtStopsNearCoordParams,
  PtTripPlan,
} from "@/lib/public-transport/types";

export type PtAdapter = {
  jurisdiction: PtJurisdiction;
  capabilities: PtCapabilities;
  searchStops(params: PtSearchStopsParams): Promise<PtStop[]>;
  stopsNearCoord(params: PtStopsNearCoordParams): Promise<PtStop[]>;
  getDepartures(params: PtDeparturesParams): Promise<PtDepartureResult>;
  getDisruptions(): Promise<PtDisruption[]>;
  planTrip(params: PtPlanTripParams): Promise<PtTripPlan>;
};

export type PtDepartureResult = {
  stopId: string;
  departures: import("@/lib/public-transport/types").PtDeparture[];
};
