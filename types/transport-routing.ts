import type { TransportRoutingProvider } from "@prisma/client";

export type { TransportRoutingProvider };

export type LatLng = { lat: number; lng: number };

export type RoutingTrafficMode = "live" | "historical" | "none";

export type RoutingSource = "tomtom_orbis" | "osrm" | "mock";

export type RoutingProviderStatus =
  | "ok"
  | "fallback"
  | "unavailable"
  | "cost_limited"
  | "misconfigured";

export type RouteOptions = {
  avoid?: string[];
  routeType?: "fast" | "short" | "efficient";
  trafficMode?: RoutingTrafficMode;
};

export type RouteEstimateInput = {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  departAt?: string;
  routeOptions?: RouteOptions;
  includeGeometry?: boolean;
};

export type RouteEstimateResult = {
  distanceMetres: number;
  /** Travel duration from the adapter, excluding participant boarding buffers. */
  durationSeconds: number;
  travelDurationSeconds: number;
  segments?: Array<{
    sequence: number;
    from: LatLng;
    to: LatLng;
    distanceMetres?: number;
    durationSeconds?: number;
  }>;
  geometry?: LatLng[];
  source: RoutingSource;
  trafficModeApplied: RoutingTrafficMode;
  liveTrafficUsed: boolean;
  providerStatus: RoutingProviderStatus;
  fallbackReason?: string;
  generatedAt: string;
  validUntil: string;
  advisoryOnly: true;
  raw?: unknown;
};

export type RouteMatrixInput = {
  sources: LatLng[];
  destinations: LatLng[];
};

export type RouteMatrixResult = {
  durationsSeconds: number[][];
  distancesMetres: number[][];
};

export type RouteOptimisationInput = {
  tripId?: string;
  stops: LatLng[];
  organisationId?: string;
};

export type RouteOptimisationSuggestion = {
  summary: string;
  score?: number;
  orderedStopIndices?: number[];
};

export const ROUTE_ADVISORY_DISCLAIMER =
  "Travel times and distances are estimates only and are not guaranteed.";

export const ROUTE_NON_LIVE_DISCLAIMER =
  "Not live traffic. Typical road speeds only. Travel times and distances are estimates only and are not guaranteed.";

export const ROUTE_SANDBOX_DISCLAIMER =
  "Sandbox estimate. Not live traffic. Typical road speeds only. Travel times and distances are estimates only and are not guaranteed.";

export const ROUTE_LIVE_TRAFFIC_DISCLAIMER =
  "Travel times include current traffic where available. They are estimates only and are not guaranteed.";

export function routingHonestyDisclaimer(params: {
  liveTrafficUsed: boolean;
  source: RoutingSource;
}): string {
  if (params.liveTrafficUsed) return ROUTE_LIVE_TRAFFIC_DISCLAIMER;
  if (params.source === "mock") return ROUTE_SANDBOX_DISCLAIMER;
  return ROUTE_NON_LIVE_DISCLAIMER;
}
