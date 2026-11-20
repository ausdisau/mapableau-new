import type { TransportRoutingProvider } from "@prisma/client";

import {
  isMajiLiveTrafficAllowed,
  majiConfig,
} from "@/lib/config/maji";
import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { createRouteEstimate } from "@/lib/transport/routing/route-estimate-service";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type { JourneyOriginKind } from "@/types/maji";
import type {
  LatLng,
  RouteEstimateResult,
  RouteOptions,
  RoutingTrafficMode,
} from "@/types/transport-routing";

export type GeneratedRouteVariant = {
  key: string;
  label: string;
  role: "current" | "alternative";
  estimate: {
    distanceMetres: number;
    durationSeconds: number;
    travelDurationSeconds: number;
    liveTrafficUsed: boolean;
    source: RouteEstimateResult["source"];
    trafficMode: RoutingTrafficMode | string | null;
    providerStatus: RouteEstimateResult["providerStatus"] | string | null;
    generatedAt: Date | string;
    validUntil: Date | string | null;
    geometry?: LatLng[];
    fromCache: boolean;
  };
};

function geometryFromUnknown(value: unknown): LatLng[] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const points = (value as { points?: unknown }).points;
  if (!Array.isArray(points)) {
    if (Array.isArray(value)) {
      return value.filter(
        (p): p is LatLng =>
          Boolean(p) &&
          typeof p === "object" &&
          typeof (p as LatLng).lat === "number" &&
          typeof (p as LatLng).lng === "number"
      );
    }
    return undefined;
  }
  return points.filter(
    (p): p is LatLng =>
      Boolean(p) &&
      typeof p === "object" &&
      typeof (p as LatLng).lat === "number" &&
      typeof (p as LatLng).lng === "number"
  );
}

function resolveTrafficMode(): RoutingTrafficMode {
  if (isMajiLiveTrafficAllowed()) return "live";
  if (transportRoutingConfig.provider === "tomtom") return "historical";
  return "none";
}

export function labelledRouteVariants(trafficMode: RoutingTrafficMode): Array<{
  key: string;
  label: string;
  role: "current" | "alternative";
  options: RouteOptions;
}> {
  const currentOptions: RouteOptions = {
    routeType: "fast",
    trafficMode,
    maxAlternatives:
      transportRoutingConfig.provider === "tomtom" && trafficMode !== "none"
        ? 2
        : 0,
  };
  return [
    {
      key: "current",
      label: "Current remaining route",
      role: "current",
      options: currentOptions,
    },
    {
      key: "avoid_tolls",
      label: "Avoid tolls",
      role: "alternative",
      options: { routeType: "fast", avoid: ["tolls"], trafficMode },
    },
    {
      key: "short",
      label: "Shorter distance",
      role: "alternative",
      options: { routeType: "short", trafficMode },
    },
  ];
}

export async function generateRouteVariants(params: {
  origin: LatLng;
  destination: LatLng;
  originKind: JourneyOriginKind;
  tripId: string;
  boardingBufferSeconds: number;
  departAt: string;
  provider?: TransportRoutingProvider;
}): Promise<{
  variants: GeneratedRouteVariant[];
  sourceUnavailable: boolean;
  costLimited: boolean;
  explanation?: string;
}> {
  const trafficMode = resolveTrafficMode();
  const variants: GeneratedRouteVariant[] = [];
  let costLimited = false;
  const sensitiveOrigin = params.originKind === "live";

  for (const spec of labelledRouteVariants(trafficMode)) {
    try {
      const result = await createRouteEstimate({
        input: {
          origin: params.origin,
          destination: params.destination,
          departAt: params.departAt,
          includeGeometry: true,
          routeOptions: spec.options,
        },
        tripId: params.tripId,
        provider: params.provider ?? transportRoutingConfig.provider,
        boardingBufferSeconds: params.boardingBufferSeconds,
        sensitiveOrigin,
      });
      if (result.estimate.providerStatus === "cost_limited") {
        costLimited = true;
      }
      if (
        result.estimate.liveTrafficUsed &&
        (!majiConfig.trafficRoutingEnabled || !isMajiLiveTrafficAllowed())
      ) {
        continue;
      }
      variants.push({
        key: spec.key,
        label: spec.label,
        role: spec.role,
        estimate: {
          distanceMetres: result.estimate.distanceMetres,
          durationSeconds: result.estimate.durationSeconds,
          travelDurationSeconds:
            result.estimate.travelDurationSeconds ??
            result.estimate.durationSeconds,
          liveTrafficUsed: Boolean(result.estimate.liveTrafficUsed),
          source: (result.estimate.source as RouteEstimateResult["source"]) ?? "mock",
          trafficMode: result.estimate.trafficMode,
          providerStatus: result.estimate.providerStatus,
          generatedAt: result.estimate.generatedAt,
          validUntil: result.estimate.expiresAt,
          geometry: geometryFromUnknown(result.estimate.geometryJson),
          fromCache: result.fromCache,
        },
      });
    } catch (error) {
      if (
        error instanceof TransportApiError &&
        error.code === "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE"
      ) {
        return {
          variants,
          sourceUnavailable: true,
          costLimited,
          explanation: error.message,
        };
      }
    }
  }

  if (variants.length === 0) {
    return {
      variants,
      sourceUnavailable: true,
      costLimited,
      explanation:
        "No remaining-route estimates were available. The booking is unchanged.",
    };
  }

  return { variants, sourceUnavailable: false, costLimited };
}
