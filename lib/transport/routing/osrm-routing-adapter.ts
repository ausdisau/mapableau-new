import { transportRoutingConfig } from "@/lib/config/transport-routing";
import type { RoutingAdapter } from "@/lib/transport/routing/routing-adapter";
import { finalizeRouteEstimate } from "@/lib/transport/routing/routing-provenance";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type {
  LatLng,
  RouteEstimateInput,
  RouteMatrixInput,
  RouteOptimisationInput,
  RouteOptimisationSuggestion,
} from "@/types/transport-routing";

function coordPair(p: { lat: number; lng: number }) {
  return `${p.lng},${p.lat}`;
}

export class OsrmRoutingAdapter implements RoutingAdapter {
  readonly provider = "osrm" as const;

  constructor(private baseUrl = transportRoutingConfig.osrmBaseUrl) {}

  async estimateRoute(input: RouteEstimateInput) {
    const coords = [
      input.origin,
      ...(input.waypoints ?? []),
      input.destination,
    ]
      .map(coordPair)
      .join(";");
    const overview = input.includeGeometry ? "simplified" : "false";
    const url = `${this.baseUrl}/route/v1/driving/${coords}?overview=${overview}&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new TransportApiError("TRANSPORT_ROUTE_NOT_FOUND");
    }
    const data = (await res.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        legs?: Array<{ distance: number; duration: number }>;
        geometry?: { coordinates?: [number, number][] };
      }>;
    };
    const route = data.routes?.[0];
    if (!route) throw new TransportApiError("TRANSPORT_ROUTE_NOT_FOUND");

    const segments =
      route.legs?.map((leg, i) => ({
        sequence: i + 1,
        from:
          i === 0
            ? input.origin
            : (input.waypoints ?? [])[i - 1] ?? input.origin,
        to:
          i < (input.waypoints?.length ?? 0)
            ? (input.waypoints ?? [])[i]
            : input.destination,
        distanceMetres: Math.round(leg.distance),
        durationSeconds: Math.round(leg.duration),
      })) ?? [];

    const geometry: LatLng[] | undefined = route.geometry?.coordinates
      ?.map(([lng, lat]) => ({ lat, lng }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    return finalizeRouteEstimate({
      distanceMetres: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      segments,
      geometry,
      source: "osrm",
      trafficModeApplied: "none",
      liveTrafficUsed: false,
      providerStatus: "ok",
      raw: { provider: "osrm", overview },
    });
  }

  async routeMatrix(input: RouteMatrixInput) {
    const sources = input.sources.map(coordPair).join(";");
    const destinations = input.destinations.map(coordPair).join(";");
    const coords = `${sources};${destinations}`;
    const url = `${this.baseUrl}/table/v1/driving/${coords}?sources=${input.sources.map((_, i) => i).join(";")}&destinations=${input.destinations.map((_, i) => i + input.sources.length).join(";")}`;
    const res = await fetch(url);
    if (!res.ok) throw new TransportApiError("TRANSPORT_ROUTE_NOT_FOUND");
    const data = (await res.json()) as {
      durations?: number[][];
      distances?: number[][];
    };
    return {
      durationsSeconds: (data.durations ?? []).map((row) =>
        row.map((v) => (v == null ? -1 : Math.round(v)))
      ),
      distancesMetres: (data.distances ?? []).map((row) =>
        row.map((v) => (v == null ? -1 : Math.round(v)))
      ),
    };
  }

  async optimise(
    input: RouteOptimisationInput
  ): Promise<RouteOptimisationSuggestion[]> {
    void input;
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "OSRM optimisation is not configured; use GraphHopper when enabled."
    );
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.baseUrl}/route/v1/driving/0,0;0,0`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const osrmRoutingAdapter = new OsrmRoutingAdapter();
