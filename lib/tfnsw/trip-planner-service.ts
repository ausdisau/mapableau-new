import { isTfnswTripPlannerAvailable } from "@/lib/config/tfnsw";
import { tfnswGetJson } from "@/lib/tfnsw/client";
import { tfnswNotConfiguredError } from "@/lib/tfnsw/tfnsw-api-error";
import type {
  TripPlannerDepartureParams,
  TripPlannerPlanParams,
  TripPlannerStopFinderParams,
} from "@/types/tfnsw";

const TP_PREFIX = "/v1/tp";

function formatItdDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function formatItdTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}${min}`;
}

function buildTripQuery(params: TripPlannerPlanParams): Record<string, string> {
  const when = new Date();
  const query: Record<string, string> = {
    outputFormat: "rapidJSON",
    coordOutputFormat: "EPSG:4326",
    type_origin: params.typeOrigin,
    name_origin: params.nameOrigin,
    type_destination: params.typeDestination,
    name_destination: params.nameDestination,
    depArrMacro: params.depArrMacro ?? "dep",
    itdDate: params.itdDate ?? formatItdDate(when),
    itdTime: params.itdTime ?? formatItdTime(when),
    calcNumberOfTrips: String(params.maxTrips ?? 3),
    TfNSWDM: "true",
  };

  if (params.coordOrigin) query.coord_origin = params.coordOrigin;
  if (params.coordDestination) query.coord_destination = params.coordDestination;

  if (params.wheelchair) {
    query.itOptionsActive = "1";
    query.wheelchair = "1";
  }

  return query;
}

/** Departures at a stop (departure board) — rapidJSON from TfNSW Trip Planner */
export async function getDeparturesAtStop(
  params: TripPlannerDepartureParams
): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  const when = new Date();
  const query: Record<string, string> = {
    outputFormat: "rapidJSON",
    coordOutputFormat: "EPSG:4326",
    mode: "direct",
    type_dm: "stop",
    depArrMacro: "dep",
    itdDate: params.itdDate ?? formatItdDate(when),
    itdTime: params.itdTime ?? formatItdTime(when),
    TfNSWDM: "true",
  };

  if (params.platformId) {
    query.nameKey_dm = "$USEPOINT$";
    query.name_dm = params.platformId;
  } else {
    query.name_dm = params.stopId;
  }

  return tfnswGetJson({
    path: `${TP_PREFIX}/departure_mon`,
    query,
  });
}

/** Multi-modal trip planning between stops or coordinates */
export async function planTrip(params: TripPlannerPlanParams): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  return tfnswGetJson({
    path: `${TP_PREFIX}/trip`,
    query: buildTripQuery(params),
  });
}

/** Trip plan from coordinate origin/destination */
export async function planTripFromCoordinates(params: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  depArrMacro?: "dep" | "arr";
  itdDate?: string;
  itdTime?: string;
  maxTrips?: number;
  wheelchair?: boolean;
}): Promise<unknown> {
  return planTrip({
    typeOrigin: "coord",
    nameOrigin: `${params.origin.lng}:${params.origin.lat}:EPSG:4326`,
    coordOrigin: `${params.origin.lng}:${params.origin.lat}:EPSG:4326`,
    typeDestination: "coord",
    nameDestination: `${params.destination.lng}:${params.destination.lat}:EPSG:4326`,
    coordDestination: `${params.destination.lng}:${params.destination.lat}:EPSG:4326`,
    depArrMacro: params.depArrMacro,
    itdDate: params.itdDate,
    itdTime: params.itdTime,
    maxTrips: params.maxTrips,
    wheelchair: params.wheelchair,
  });
}

/** Stop / address autocomplete for trip planning */
export async function findStops(params: TripPlannerStopFinderParams): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  return tfnswGetJson({
    path: `${TP_PREFIX}/stop_finder`,
    query: {
      outputFormat: "rapidJSON",
      coordOutputFormat: "EPSG:4326",
      type_sf: "any",
      name_sf: params.query,
      maxNo: String(params.maxResults ?? 10),
      TfNSWDM: "true",
    },
  });
}

/** Service alerts (incidents affecting public transport) */
export async function getServiceAlerts(): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  return tfnswGetJson({
    path: `${TP_PREFIX}/service_alert`,
    query: {
      outputFormat: "rapidJSON",
      TfNSWDM: "true",
    },
  });
}

/** Stops near a coordinate */
export async function getStopsNearCoordinate(params: {
  lat: number;
  lng: number;
  radiusMetres?: number;
}): Promise<unknown> {
  if (!isTfnswTripPlannerAvailable()) throw tfnswNotConfiguredError();

  return tfnswGetJson({
    path: `${TP_PREFIX}/coord`,
    query: {
      outputFormat: "rapidJSON",
      coordOutputFormat: "EPSG:4326",
      coord: `${params.lng}:${params.lat}:EPSG:4326`,
      inclFilter: "1",
      radius_1: String(params.radiusMetres ?? 500),
      TfNSWDM: "true",
    },
  });
}
