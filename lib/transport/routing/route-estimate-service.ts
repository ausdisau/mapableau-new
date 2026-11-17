import type { Prisma, TransportRoutingProvider } from "@prisma/client";

import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { prisma } from "@/lib/prisma";
import { boardingBufferSecondsForMobility } from "@/lib/transport/routing/boarding-buffer";
import {
  buildRouteCacheKey,
  getCachedEstimate,
  rememberEstimate,
} from "@/lib/transport/routing/route-cache-service";
import { executeRouteEstimate } from "@/lib/transport/routing/routing-estimate-executor";
import {
  estimateTtlMs,
  redactRoutingRaw,
} from "@/lib/transport/routing/routing-provenance";
import { isTomTomDailyCapReached } from "@/lib/transport/routing/tomtom-usage";
import { resolveTomTomTrafficMode } from "@/lib/transport/routing/tomtom-orbis-routing-adapter";
import {
  buildTrafficAdvisoryForRoute,
  permittedHazardEvidence,
} from "@/lib/tfnsw/traffic-advisory-service";
import type { TrafficAdvisory } from "@/types/tfnsw";
import type {
  RouteEstimateInput,
  RoutingSource,
  RoutingTrafficMode,
} from "@/types/transport-routing";
import { routingHonestyDisclaimer } from "@/types/transport-routing";

export async function createRouteEstimate(params: {
  input: RouteEstimateInput;
  tripId?: string;
  provider?: TransportRoutingProvider;
  boardingBufferSeconds?: number;
}) {
  const input: RouteEstimateInput = {
    ...params.input,
    includeGeometry: params.input.includeGeometry ?? true,
  };
  const requested = params.provider ?? transportRoutingConfig.provider;
  const planned = await plannedCacheIdentity(requested, input);
  const cacheKey = buildRouteCacheKey({
    provider: planned.provider,
    origin: input.origin,
    destination: input.destination,
    waypoints: input.waypoints,
    departAt: input.departAt,
    routeOptions: {
      ...input.routeOptions,
      trafficMode: planned.trafficMode,
    },
  });

  const cached = await getCachedEstimate(cacheKey);
  if (cached) {
    const trafficAdvisory = await maybeTrafficAdvisory(
      input,
      geometryFromJson(cached.geometryJson)
    );
    return {
      estimate: cached,
      advisoryDisclaimer: routingHonestyDisclaimer({
        liveTrafficUsed: cached.liveTrafficUsed,
        source: (cached.source as RoutingSource) ?? "mock",
      }),
      fromCache: true,
      ...(trafficAdvisory ? { trafficAdvisory } : {}),
    };
  }

  const executed = await executeRouteEstimate({
    input,
    provider: requested,
  });

  const persistKey =
    executed.provider === planned.provider
      ? cacheKey
      : buildRouteCacheKey({
          provider: executed.provider,
          origin: input.origin,
          destination: input.destination,
          waypoints: input.waypoints,
          departAt: input.departAt,
          routeOptions: {
            ...input.routeOptions,
            trafficMode: executed.result.trafficModeApplied,
          },
        });

  let boardingBufferSeconds = params.boardingBufferSeconds ?? 0;
  if (params.tripId && params.boardingBufferSeconds == null) {
    const trip = await prisma.transportTrip.findUnique({
      where: { id: params.tripId },
      select: { mobilityRequirements: true },
    });
    boardingBufferSeconds = boardingBufferSecondsForMobility(
      trip?.mobilityRequirements
    );
  }

  const expiresAt = new Date(
    Date.parse(executed.result.validUntil) ||
      Date.now() + estimateTtlMs(executed.result.liveTrafficUsed)
  );

  const trafficAdvisory = await maybeTrafficAdvisory(
    input,
    executed.result.geometry
  );

  const estimate = await prisma.transportRouteEstimate.create({
    data: {
      tripId: params.tripId,
      provider: executed.provider,
      distanceMetres: executed.result.distanceMetres,
      durationSeconds: executed.result.durationSeconds,
      travelDurationSeconds: executed.result.travelDurationSeconds,
      boardingBufferSeconds,
      advisoryOnly: true,
      cacheKey: persistKey,
      rawResponse: redactRoutingRaw(executed.result.raw) as
        | Prisma.InputJsonValue
        | undefined,
      expiresAt,
      source: executed.result.source,
      trafficMode: executed.result.trafficModeApplied,
      liveTrafficUsed: executed.result.liveTrafficUsed,
      providerStatus: executed.result.providerStatus,
      fallbackReason: executed.result.fallbackReason,
      generatedAt: new Date(executed.result.generatedAt),
      geometryJson: executed.result.geometry
        ? { points: executed.result.geometry }
        : undefined,
      hazardEvidence: trafficAdvisory
        ? permittedHazardEvidence(trafficAdvisory)
        : undefined,
    },
  });

  if (executed.result.segments?.length) {
    await prisma.transportRouteSegment.createMany({
      data: executed.result.segments.map((s) => ({
        estimateId: estimate.id,
        sequence: s.sequence,
        fromLat: s.from.lat,
        fromLng: s.from.lng,
        toLat: s.to.lat,
        toLng: s.to.lng,
        distanceMetres: s.distanceMetres,
        durationSeconds: s.durationSeconds,
      })),
    });
  }

  rememberEstimate(
    persistKey,
    estimate.id,
    estimateTtlMs(executed.result.liveTrafficUsed),
    params.tripId
  );

  return {
    estimate,
    advisoryDisclaimer: routingHonestyDisclaimer({
      liveTrafficUsed: executed.result.liveTrafficUsed,
      source: executed.result.source,
    }),
    fromCache: false,
    ...(trafficAdvisory ? { trafficAdvisory } : {}),
  };
}

async function plannedCacheIdentity(
  requested: TransportRoutingProvider,
  input: RouteEstimateInput
): Promise<{ provider: TransportRoutingProvider; trafficMode: RoutingTrafficMode }> {
  if (requested === "tomtom") {
    if (!transportRoutingConfig.tomtomApiKey || (await isTomTomDailyCapReached())) {
      return { provider: "osrm", trafficMode: "none" };
    }
    return { provider: "tomtom", trafficMode: resolveTomTomTrafficMode() };
  }
  return {
    provider: requested === "disabled" ? "mock" : requested,
    trafficMode: input.routeOptions?.trafficMode ?? "none",
  };
}

function geometryFromJson(value: unknown): { lat: number; lng: number }[] | undefined {
  if (!value || typeof value !== "object") return undefined;
  const points = (value as { points?: unknown }).points;
  if (!Array.isArray(points)) return undefined;
  return points.filter(
    (p): p is { lat: number; lng: number } =>
      Boolean(p) &&
      typeof p === "object" &&
      typeof (p as { lat: unknown }).lat === "number" &&
      typeof (p as { lng: unknown }).lng === "number"
  );
}

async function maybeTrafficAdvisory(
  input: RouteEstimateInput,
  geometry?: { lat: number; lng: number }[]
): Promise<TrafficAdvisory | undefined> {
  const advisory = await buildTrafficAdvisoryForRoute({
    origin: input.origin,
    destination: input.destination,
    waypoints: input.waypoints,
    geometry,
  });
  return advisory ?? undefined;
}
