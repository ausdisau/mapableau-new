import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { osrmRoutingAdapter } from "@/lib/transport/routing/osrm-routing-adapter";
import { getRoutingAdapter } from "@/lib/transport/routing/routing-provider-registry";
import { finalizeRouteEstimate } from "@/lib/transport/routing/routing-provenance";
import {
  incrementTomTomUsage,
  isTomTomDailyCapReached,
} from "@/lib/transport/routing/tomtom-usage";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type {
  RouteEstimateInput,
  RouteEstimateResult,
} from "@/types/transport-routing";
import type { TransportRoutingProvider } from "@prisma/client";

export type EstimateExecution = {
  result: RouteEstimateResult;
  provider: TransportRoutingProvider;
};

async function osrmFallback(
  input: RouteEstimateInput,
  reason: string,
  status: RouteEstimateResult["providerStatus"]
): Promise<EstimateExecution> {
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
}): Promise<EstimateExecution> {
  const requested = params.provider ?? transportRoutingConfig.provider;

  if (requested === "tomtom") {
    if (!transportRoutingConfig.tomtomApiKey) {
      if (process.env.NODE_ENV === "production" && requested === "tomtom") {
        return osrmFallback(
          params.input,
          "tomtom_missing_key",
          "misconfigured"
        );
      }
      return osrmFallback(params.input, "tomtom_missing_key", "misconfigured");
    }
    if (await isTomTomDailyCapReached()) {
      return osrmFallback(params.input, "tomtom_daily_cap", "cost_limited");
    }
    try {
      await incrementTomTomUsage();
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
      return osrmFallback(params.input, "tomtom_upstream_error", "fallback");
    }
  }

  if (requested === "disabled" && process.env.NODE_ENV === "production") {
    throw new TransportApiError("TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE");
  }

  const adapter = getRoutingAdapter(requested);
  const result = await adapter.estimateRoute(params.input);
  return { provider: adapter.provider, result };
}
