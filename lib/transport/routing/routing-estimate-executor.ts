import type { TransportRoutingProvider } from "@prisma/client";

import {
  shouldBlockPublicOsrmFallback,
  transportRoutingConfig,
} from "@/lib/config/transport-routing";
import { osrmRoutingAdapter } from "@/lib/transport/routing/osrm-routing-adapter";
import { finalizeRouteEstimate } from "@/lib/transport/routing/routing-provenance";
import { getRoutingAdapter } from "@/lib/transport/routing/routing-provider-registry";
import { tryReserveTomTomSlot } from "@/lib/transport/routing/tomtom-usage";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type {
  RouteEstimateInput,
  RouteEstimateResult,
} from "@/types/transport-routing";

export type EstimateExecution = {
  result: RouteEstimateResult;
  provider: TransportRoutingProvider;
};

async function osrmFallback(
  input: RouteEstimateInput,
  reason: string,
  status: RouteEstimateResult["providerStatus"],
  sensitiveOrigin?: boolean
): Promise<EstimateExecution> {
  if (shouldBlockPublicOsrmFallback({ sensitiveOrigin })) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "Routing fallback is not available. A private route service is not configured."
    );
  }
  const result = await osrmRoutingAdapter.estimateRoute({
    ...input,
    includeGeometry: input.includeGeometry ?? true,
  });
  return {
    provider: "osrm",
    result: finalizeRouteEstimate({
      ...result,
      source: "osrm",
      trafficModeApplied: "none",
      liveTrafficUsed: false,
      providerStatus: status,
      fallbackReason: reason,
    }),
  };
}

export async function executeRouteEstimate(params: {
  input: RouteEstimateInput;
  provider?: TransportRoutingProvider;
  sensitiveOrigin?: boolean;
}): Promise<EstimateExecution> {
  const requested = params.provider ?? transportRoutingConfig.provider;

  if (requested === "tomtom") {
    if (!transportRoutingConfig.tomtomApiKey) {
      return osrmFallback(
        params.input,
        "tomtom_missing_key",
        "misconfigured",
        params.sensitiveOrigin
      );
    }
    if (!(await tryReserveTomTomSlot())) {
      return osrmFallback(
        params.input,
        "tomtom_daily_cap",
        "cost_limited",
        params.sensitiveOrigin
      );
    }
    try {
      const adapter = getRoutingAdapter("tomtom");
      const result = await adapter.estimateRoute(params.input);
      return { provider: "tomtom", result };
    } catch (error) {
      if (
        error instanceof TransportApiError &&
        error.code === "TRANSPORT_VALIDATION_FAILED"
      ) {
        throw error;
      }
      return osrmFallback(
        params.input,
        "tomtom_upstream_error",
        "fallback",
        params.sensitiveOrigin
      );
    }
  }

  if (requested === "disabled" && process.env.NODE_ENV === "production") {
    throw new TransportApiError("TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE");
  }

  if (
    requested === "osrm" &&
    shouldBlockPublicOsrmFallback({ sensitiveOrigin: params.sensitiveOrigin })
  ) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "Routing fallback is not available. A private route service is not configured."
    );
  }

  const adapter = getRoutingAdapter(requested);
  const result = await adapter.estimateRoute(params.input);
  return { provider: adapter.provider, result };
}
