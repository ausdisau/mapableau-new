/** Australian public transport jurisdictions supported by MapAble. */
export type PtJurisdiction = "NSW" | "VIC" | "QLD" | "ACT" | "SA" | "WA" | "TAS" | "NT";

export type LatLng = { lat: number; lng: number };

export type PtCapabilities = {
  jurisdiction: PtJurisdiction;
  tripPlanning: boolean;
  stopSearch: boolean;
  departures: boolean;
  disruptions: boolean;
  wheelchairFilter: boolean;
  linkOutUrl: string | null;
  disclaimer: string;
};

export type PtStop = {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  modes?: string[];
  wheelchairAccessible?: boolean | null;
  distanceMetres?: number;
};

export type PtDeparture = {
  stopId: string;
  routeName?: string;
  routeNumber?: string;
  destination?: string;
  scheduledTime?: string;
  estimatedTime?: string;
  isRealtime?: boolean;
  isCancelled?: boolean;
  platform?: string;
  mode?: string;
};

export type PtDisruption = {
  id?: string;
  headline: string;
  description?: string;
  status?: string;
  url?: string;
  affectedLines?: string[];
  affectedStops?: string[];
  publishedAt?: string;
};

export type PtTripLeg = {
  mode: string;
  origin: string;
  destination: string;
  departureTime?: string;
  arrivalTime?: string;
  durationMinutes?: number;
  routeNumber?: string;
  wheelchairAccessible?: boolean;
  isOnDemand?: boolean;
};

export type PtTripOption = {
  departureTime?: string;
  arrivalTime?: string;
  durationMinutes?: number;
  legs: PtTripLeg[];
  wheelchairAccessible?: boolean;
};

export type PtTripPlan = {
  jurisdiction: PtJurisdiction;
  options: PtTripOption[];
  disclaimer: string;
};

export type PtSearchStopsParams = {
  query: string;
  maxResults?: number;
};

export type PtStopsNearCoordParams = {
  lat: number;
  lng: number;
  radiusMetres?: number;
  maxResults?: number;
};

export type PtDeparturesParams = {
  stopId: string;
  routeType?: number;
  maxResults?: number;
  itdDate?: string;
  itdTime?: string;
  platformId?: string;
};

export type PtPlanTripParams = {
  originStopId?: string;
  destinationStopId?: string;
  origin?: LatLng;
  destination?: LatLng;
  depArrMacro?: "dep" | "arr";
  itdDate?: string;
  itdTime?: string;
  maxTrips?: number;
  wheelchair?: boolean;
};

export const PT_DISCLAIMERS: Record<PtJurisdiction, string> = {
  NSW:
    "Public transport information from Transport for NSW is indicative only. Check transportnsw.info before travelling.",
  VIC:
    "Public transport information from Public Transport Victoria is indicative only. Check ptv.vic.gov.au before travelling.",
  QLD:
    "Public transport information from Translink is indicative only. Check translink.com.au before travelling.",
  ACT:
    "Public transport information from Transport Canberra is indicative only. Check transport.act.gov.au before travelling.",
  SA:
    "Public transport information from Adelaide Metro is indicative only. Check adelaidemetro.com.au before travelling.",
  WA:
    "Public transport information from Transperth is indicative only. Check transperth.wa.gov.au before travelling.",
  TAS:
    "Public transport information from Transport Tasmania is indicative only. Check transport.tas.gov.au before travelling.",
  NT:
    "Public transport information from NT public transport is indicative only. Check transport.nt.gov.au before travelling.",
};

export const PT_LINK_OUT: Record<PtJurisdiction, string> = {
  NSW: "https://transportnsw.info/trip",
  VIC: "https://www.ptv.vic.gov.au/journey/",
  QLD: "https://translink.com.au/planner",
  ACT: "https://www.transport.act.gov.au/",
  SA: "https://www.adelaidemetro.com.au/plan-a-trip",
  WA: "https://www.transperth.wa.gov.au/",
  TAS: "https://www.transport.tas.gov.au/public_transport",
  NT: "https://www.transport.nt.gov.au/public-transport",
};
