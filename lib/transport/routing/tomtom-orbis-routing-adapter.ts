import {
  isTomTomLiveTrafficAllowed,
  transportRoutingConfig,
} from "@/lib/config/transport-routing";
import { finalizeRouteEstimate } from "@/lib/transport/routing/routing-provenance";
import type { RoutingAdapter } from "@/lib/transport/routing/routing-adapter";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type {
  LatLng,
  RouteEstimateInput,
  RouteEstimateResult,
  RouteMatrixInput,
  RouteOptimisationInput,
  RoutingTrafficMode,
} from "@/types/transport-routing";

const ORBIS_CALCULATE_ROUTE =
  "https://api.tomtom.com/maps/orbis/routing/calculateRoute";

type TomTomPoint = { latitude?: number; longitude?: number };

type TomTomSummary = {
  lengthInMeters?: number;
  travelTimeInSeconds?: number;
  trafficDelayInSeconds?: number;
};

type TomTomLeg = {
  summary?: TomTomSummary;
  points?: TomTomPoint[];
};

type TomTomRoute = {
  summary?: TomTomSummary;
  legs?: TomTomLeg[];
  sections?: Array<{
    sectionType?: string;
    startPointIndex?: number;
    endPointIndex?: number;
    simpleCategory?: string;
    delayInSeconds?: number;
  }>;
};

type TomTomRouteResponse = {
  routes?: TomTomRoute[];
  detailedError?: { code?: string; message?: string };
};

function locationPath(points: LatLng[]): string {
  return points.map((p) => `${p.lat},${p.lng}`).join(":");
}

function pointsFromLegs(legs: TomTomLeg[] | undefined): LatLng[] {
  const out: LatLng[] = [];
  for (const leg of legs ?? []) {
    for (const point of leg.points ?? []) {
      if (
        typeof point.latitude === "number" &&
        typeof point.longitude === "number"
      ) {
        out.push({ lat: point.latitude, lng: point.longitude });
      }
    }
  }
  return out;
}

export function resolveTomTomTrafficMode(): RoutingTrafficMode {
  return isTomTomLiveTrafficAllowed() ? "live" : "historical";
}

export function mapTomTomRouteResponse(
  data: TomTomRouteResponse,
  input: RouteEstimateInput,
  trafficMode: RoutingTrafficMode
): RouteEstimateResult {
  const route = data.routes?.[0];
  const summary = route?.summary;
  if (!route || summary?.lengthInMeters == null || summary.travelTimeInSeconds == null) {
    throw new TransportApiError("TRANSPORT_ROUTE_NOT_FOUND");
  }

  const waypoints = input.waypoints ?? [];
  const segments =
    route.legs?.map((leg, i) => ({
      sequence: i + 1,
      from: i === 0 ? input.origin : waypoints[i - 1] ?? input.origin,
      to: i < waypoints.length ? waypoints[i] : input.destination,
      distanceMetres: Math.round(leg.summary?.lengthInMeters ?? 0),
      durationSeconds: Math.round(leg.summary?.travelTimeInSeconds ?? 0),
    })) ?? [];

  const geometry = pointsFromLegs(route.legs);

  return finalizeRouteEstimate({
    distanceMetres: Math.round(summary.lengthInMeters),
    durationSeconds: Math.round(summary.travelTimeInSeconds),
    segments,
    geometry: geometry.length ? geometry : undefined,
    source: "tomtom_orbis",
    trafficModeApplied: trafficMode,
    liveTrafficUsed: trafficMode === "live",
    providerStatus: "ok",
    raw: {
      trafficDelayInSeconds: summary.trafficDelayInSeconds ?? 0,
      sections: route.sections,
    },
  });
}

export class TomTomOrbisRoutingAdapter implements RoutingAdapter {
  readonly provider = "tomtom" as const;

  constructor(
    private apiKey = transportRoutingConfig.tomtomApiKey,
    private fetchImpl: typeof fetch = fetch
  ) {}

  async estimateRoute(input: RouteEstimateInput): Promise<RouteEstimateResult> {
    if (!this.apiKey) {
      throw new TransportApiError(
        "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
        "TomTom routing is not configured."
      );
    }

    const maxWaypoints = transportRoutingConfig.tomtomMaxWaypoints;
    if ((input.waypoints?.length ?? 0) > maxWaypoints) {
      throw new TransportApiError(
        "TRANSPORT_VALIDATION_FAILED",
        `A route can include at most ${maxWaypoints} waypoints.`
      );
    }

    const points = [
      input.origin,
      ...(input.waypoints ?? []),
      input.destination,
    ];
    const trafficMode =
      input.routeOptions?.trafficMode === "historical"
        ? "historical"
        : input.routeOptions?.trafficMode === "live" && isTomTomLiveTrafficAllowed()
          ? "live"
          : resolveTomTomTrafficMode();

    const url = new URL(
      `${ORBIS_CALCULATE_ROUTE}/${locationPath(points)}/json`
    );
    url.searchParams.set("apiVersion", "2");
    url.searchParams.set("traffic", trafficMode);
    url.searchParams.set("travelMode", "car");
    url.searchParams.set("sectionType", "traffic");
    url.searchParams.set("routeRepresentation", "polyline");
    url.searchParams.set("routeType", input.routeOptions?.routeType ?? "fast");
    if (input.departAt) url.searchParams.set("departAt", input.departAt);
    for (const avoid of input.routeOptions?.avoid ?? []) {
      url.searchParams.append("avoid", avoid);
    }

    const res = await this.fetchImpl(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "TomTom-Api-Version": "2",
        "TomTom-Api-Key": this.apiKey,
      },
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await res.json().catch(() => ({}))) as TomTomRouteResponse;
    if (!res.ok) {
      throw new TransportApiError(
        "TRANSPORT_ROUTE_NOT_FOUND",
        data.detailedError?.message ?? "TomTom could not calculate that route."
      );
    }
    return mapTomTomRouteResponse(data, input, trafficMode);
  }

  async routeMatrix(_input: RouteMatrixInput): Promise<never> {
    void _input;
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "TomTom matrix routing is not part of this pilot."
    );
  }

  async optimise(
    input: RouteOptimisationInput
  ): Promise<never> {
    void input;
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "TomTom route optimisation is not part of this pilot."
    );
  }

  async healthCheck() {
    return Boolean(this.apiKey);
  }
}

export const tomtomOrbisRoutingAdapter = new TomTomOrbisRoutingAdapter();
