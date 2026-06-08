import { uberConfig, isUberSdkConfigured } from "@/lib/uber/config";
import { UberApiError } from "@/lib/uber/errors";
import { getUberAccessToken } from "@/lib/uber/oauth";
import type {
  UberCreateGuestTripRequest,
  UberGuestTrip,
  UberListTripsParams,
  UberListTripsResponse,
  UberTripEstimatesRequest,
  UberTripEstimatesResponse,
} from "@/lib/uber/types";

export type UberRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, query?: UberRequestOptions["query"]): string {
  const base = uberConfig.apiBaseUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalized}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function organizationHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (uberConfig.organizationUuid) {
    headers["x-uber-organizationuuid"] = uberConfig.organizationUuid;
  }
  if (uberConfig.useSandbox && uberConfig.runUuid) {
    headers["x-uber-runuuid"] = uberConfig.runUuid;
  }
  return headers;
}

async function parseErrorResponse(res: Response): Promise<UberApiError> {
  const body = await res.json().catch(() => ({}));
  const record = body as { message?: string; code?: string };
  return new UberApiError(
    record.message ?? `Uber API error (${res.status})`,
    res.status,
    record.code,
    body
  );
}

/**
 * Typed HTTP client for Uber Guest Rides API (`/v1/guests/*`).
 * There is no official Node SDK; this is MapAble's SDK-shaped wrapper.
 */
export class UberClient {
  static assertConfigured(): void {
    if (!isUberSdkConfigured()) {
      throw new UberApiError(
        "Uber Guest Rides is not configured",
        503,
        "UBER_NOT_CONFIGURED"
      );
    }
  }

  async request<T>(path: string, options: UberRequestOptions = {}): Promise<T> {
    UberClient.assertConfigured();
    const token = await getUberAccessToken();
    const url = buildUrl(path, options.query);

    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        ...organizationHeaders(),
        Authorization: `Bearer ${token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 204) {
      return undefined as T;
    }

    if (!res.ok) {
      throw await parseErrorResponse(res);
    }

    return (await res.json()) as T;
  }

  getTripEstimates(body: UberTripEstimatesRequest) {
    return this.request<UberTripEstimatesResponse>("/v1/guests/trips/estimates", {
      method: "POST",
      body,
    });
  }

  createGuestTrip(body: UberCreateGuestTripRequest) {
    return this.request<UberGuestTrip>("/v1/guests/trips", {
      method: "POST",
      body,
    });
  }

  getGuestTrip(requestId: string, includeEditableFields = false) {
    return this.request<UberGuestTrip>(`/v1/guests/trips/${requestId}`, {
      query: includeEditableFields
        ? { include_editable_fields: "true" }
        : undefined,
    });
  }

  listGuestTrips(params: UberListTripsParams = {}) {
    return this.request<UberListTripsResponse>("/v1/guests/trips", {
      query: {
        trip_status: params.trip_status,
        start_key: params.start_key,
        limit: params.limit,
      },
    });
  }

  cancelGuestTrip(requestId: string) {
    return this.request<void>(`/v1/guests/trips/${requestId}`, {
      method: "DELETE",
    });
  }
}

let defaultClient: UberClient | null = null;

export function getUberClient(): UberClient {
  if (!defaultClient) {
    defaultClient = new UberClient();
  }
  return defaultClient;
}
