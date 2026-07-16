import { isPtvAvailable } from "@/lib/config/ptv";
import { ptvGetJson, ptvNotConfiguredError } from "@/lib/ptv/client";
import {
  parsePtvDepartures,
  parsePtvDisruptions,
  parsePtvNearbyStops,
  parsePtvSearchStops,
} from "@/lib/ptv/normalize";

export async function searchStops(query: string, maxResults = 10): Promise<unknown> {
  if (!isPtvAvailable()) throw ptvNotConfiguredError();
  return ptvGetJson({
    path: `/v3/search/${encodeURIComponent(query)}`,
    query: { max_results: maxResults },
  });
}

export async function stopsNearCoord(params: {
  lat: number;
  lng: number;
  maxResults?: number;
}): Promise<unknown> {
  if (!isPtvAvailable()) throw ptvNotConfiguredError();
  return ptvGetJson({
    path: `/v3/stops/location/${params.lat},${params.lng}`,
    query: { max_results: params.maxResults ?? 10 },
  });
}

export async function getDepartures(params: {
  routeType: number;
  stopId: string;
  maxResults?: number;
}): Promise<unknown> {
  if (!isPtvAvailable()) throw ptvNotConfiguredError();
  return ptvGetJson({
    path: `/v3/departures/route_type/${params.routeType}/stop/${params.stopId}`,
    query: {
      max_results: params.maxResults ?? 10,
      include_cancelled: false,
    },
  });
}

export async function getDisruptions(): Promise<unknown> {
  if (!isPtvAvailable()) throw ptvNotConfiguredError();
  return ptvGetJson({ path: "/v3/disruptions" });
}

export {
  parsePtvSearchStops,
  parsePtvNearbyStops,
  parsePtvDepartures,
  parsePtvDisruptions,
};
