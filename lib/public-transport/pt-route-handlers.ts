import { jsonOk } from "@/lib/api/response";
import {
  getPtAdapter,
  getPtCapabilities,
  listConfiguredJurisdictions,
} from "@/lib/public-transport/pt-provider-registry";
import {
  parseOptionalBoolean,
  parseOptionalNumber,
  resolvePtJurisdictionFromRequest,
} from "@/lib/public-transport/request-helpers";
import { requirePtReadAccess } from "@/lib/public-transport/require-pt-read";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { handleTransportRouteError } from "@/lib/transport/transport-route-handler";
import {
  ptCapabilitiesQuerySchema,
  ptCoordSchema,
  ptDeparturesSchema,
  ptDisruptionsSchema,
  ptStopSearchSchema,
  ptTripPlanQuerySchema,
} from "@/lib/validation/tfnsw-schemas";

function jurisdictionFromUrl(url: URL) {
  return resolvePtJurisdictionFromRequest({
    jurisdiction: url.searchParams.get("jurisdiction"),
    lat: parseOptionalNumber(url.searchParams.get("lat")),
    lng: parseOptionalNumber(url.searchParams.get("lng")),
  });
}

export async function GET_CAPABILITIES(req: Request) {
  const user = await requirePtReadAccess();
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = ptCapabilitiesQuerySchema.parse({
      lat: url.searchParams.get("lat") ?? undefined,
      lng: url.searchParams.get("lng") ?? undefined,
      jurisdiction: url.searchParams.get("jurisdiction") ?? undefined,
    });

    const jurisdiction =
      params.jurisdiction ??
      (params.lat != null && params.lng != null
        ? resolvePtJurisdictionFromRequest({ lat: params.lat, lng: params.lng })
        : null);

    if (!jurisdiction) {
      return jsonOk({
        configured: listConfiguredJurisdictions(),
        capabilities: null,
      });
    }

    return jsonOk({
      jurisdiction,
      capabilities: getPtCapabilities(jurisdiction),
      configured: listConfiguredJurisdictions(),
    });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function GET_STOP_SEARCH(req: Request) {
  const user = await requirePtReadAccess();
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = ptStopSearchSchema.parse({
      query: url.searchParams.get("query"),
      maxResults: url.searchParams.get("maxResults") ?? undefined,
      jurisdiction: url.searchParams.get("jurisdiction") ?? undefined,
      lat: url.searchParams.get("lat") ?? undefined,
      lng: url.searchParams.get("lng") ?? undefined,
    });
    const jurisdiction =
      params.jurisdiction ??
      resolvePtJurisdictionFromRequest({ lat: params.lat, lng: params.lng });
    const adapter = getPtAdapter(jurisdiction);
    const stops = await adapter.searchStops(params);
    return jsonOk({ jurisdiction, capabilities: adapter.capabilities, stops });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function GET_COORD(req: Request) {
  const user = await requirePtReadAccess();
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = ptCoordSchema.parse({
      lat: url.searchParams.get("lat"),
      lng: url.searchParams.get("lng"),
      radiusMetres: url.searchParams.get("radiusMetres") ?? undefined,
      maxResults: url.searchParams.get("maxResults") ?? undefined,
      jurisdiction: url.searchParams.get("jurisdiction") ?? undefined,
    });
    const jurisdiction =
      params.jurisdiction ?? resolvePtJurisdictionFromRequest({ lat: params.lat, lng: params.lng });
    const adapter = getPtAdapter(jurisdiction);
    const stops = await adapter.stopsNearCoord(params);
    return jsonOk({ jurisdiction, capabilities: adapter.capabilities, stops });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function GET_DEPARTURES(req: Request) {
  const user = await requirePtReadAccess();
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = ptDeparturesSchema.parse({
      stopId: url.searchParams.get("stopId"),
      routeType: url.searchParams.get("routeType") ?? undefined,
      maxResults: url.searchParams.get("maxResults") ?? undefined,
      itdDate: url.searchParams.get("itdDate") ?? undefined,
      itdTime: url.searchParams.get("itdTime") ?? undefined,
      platformId: url.searchParams.get("platformId") ?? undefined,
      jurisdiction: url.searchParams.get("jurisdiction") ?? undefined,
      lat: url.searchParams.get("lat") ?? undefined,
      lng: url.searchParams.get("lng") ?? undefined,
    });
    const jurisdiction =
      params.jurisdiction ??
      resolvePtJurisdictionFromRequest({ lat: params.lat, lng: params.lng });
    const adapter = getPtAdapter(jurisdiction);
    const board = await adapter.getDepartures(params);
    return jsonOk({ jurisdiction, capabilities: adapter.capabilities, ...board });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function GET_DISRUPTIONS(req: Request) {
  const user = await requirePtReadAccess();
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = ptDisruptionsSchema.parse({
      jurisdiction: url.searchParams.get("jurisdiction") ?? undefined,
      lat: url.searchParams.get("lat") ?? undefined,
      lng: url.searchParams.get("lng") ?? undefined,
    });
    const jurisdiction =
      params.jurisdiction ??
      (params.lat != null && params.lng != null
        ? resolvePtJurisdictionFromRequest({ lat: params.lat, lng: params.lng })
        : "NSW");
    const adapter = getPtAdapter(jurisdiction);
    const disruptions = await adapter.getDisruptions();
    return jsonOk({ jurisdiction, capabilities: adapter.capabilities, disruptions });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export async function GET_TRIP(req: Request) {
  const user = await requirePtReadAccess();
  if (user instanceof Response) return user;
  try {
    const url = new URL(req.url);
    const params = ptTripPlanQuerySchema.parse({
      originStopId: url.searchParams.get("originStopId") ?? undefined,
      destinationStopId: url.searchParams.get("destinationStopId") ?? undefined,
      origin:
        url.searchParams.get("originLat") && url.searchParams.get("originLng")
          ? {
              lat: Number(url.searchParams.get("originLat")),
              lng: Number(url.searchParams.get("originLng")),
            }
          : undefined,
      destination:
        url.searchParams.get("destinationLat") && url.searchParams.get("destinationLng")
          ? {
              lat: Number(url.searchParams.get("destinationLat")),
              lng: Number(url.searchParams.get("destinationLng")),
            }
          : undefined,
      depArrMacro: url.searchParams.get("depArrMacro") ?? undefined,
      itdDate: url.searchParams.get("itdDate") ?? undefined,
      itdTime: url.searchParams.get("itdTime") ?? undefined,
      maxTrips: url.searchParams.get("maxTrips")
        ? Number(url.searchParams.get("maxTrips"))
        : undefined,
      wheelchair: parseOptionalBoolean(url.searchParams.get("wheelchair")),
      jurisdiction: url.searchParams.get("jurisdiction") ?? undefined,
    });

    const jurisdiction =
      params.jurisdiction ??
      resolvePtJurisdictionFromRequest({
        lat: params.origin?.lat ?? parseOptionalNumber(url.searchParams.get("lat")),
        lng: params.origin?.lng ?? parseOptionalNumber(url.searchParams.get("lng")),
      });

    const adapter = getPtAdapter(jurisdiction);
    if (!adapter.capabilities.tripPlanning) {
      throw new TransportApiError(
        "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
        `Multi-leg trip planning is not available for ${jurisdiction}. Use the official journey planner.`,
        {
          jurisdiction,
          linkOutUrl: adapter.capabilities.linkOutUrl,
          tripPlanningSupported: false,
        }
      );
    }

    const plan = await adapter.planTrip(params);
    return jsonOk({ jurisdiction, capabilities: adapter.capabilities, plan });
  } catch (e) {
    return handleTransportRouteError(e);
  }
}

export { jurisdictionFromUrl };
