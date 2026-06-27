import { TransportApiError } from "@/lib/transport/transport-api-error";

export function ptvNotConfiguredError() {
  return new TransportApiError(
    "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    "PTV Timetable API is not configured. Set PTV_DEV_ID and PTV_API_KEY on the server."
  );
}

export function ptvUpstreamError(status: number, detail?: string) {
  return new TransportApiError(
    "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    detail ?? `PTV API returned status ${status}. Please try again later.`,
    { upstreamStatus: status }
  );
}

export function translinkNotConfiguredError() {
  return new TransportApiError(
    "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    "Translink GTFS data is not available."
  );
}

export function ptTripPlanningNotSupported(jurisdiction: string, linkOutUrl: string) {
  return new TransportApiError(
    "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
    `Multi-leg trip planning is not available for ${jurisdiction}. Use the official journey planner.`,
    { jurisdiction, linkOutUrl, tripPlanningSupported: false }
  );
}
