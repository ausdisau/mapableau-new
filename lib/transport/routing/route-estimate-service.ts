import type { Prisma, TransportRouteEstimate, TransportRoutingProvider } from "@prisma/client";

import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { prisma } from "@/lib/prisma";
import {
  buildTrafficAdvisoryForRoute,
  permittedHazardEvidence,
} from "@/lib/tfnsw/traffic-advisory-service";
import {
  boardingBufferSecondsForMobility,
  providerTravelSeconds,
} from "@/lib/transport/routing/boarding-buffer";
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
import { resolveTomTomTrafficModeForInput } from "@/lib/transport/routing/tomtom-orbis-routing-adapter";
import { isTomTomDailyCapReached } from "@/lib/transport/routing/tomtom-usage";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type { TrafficAdvisory } from "@/types/tfnsw";
import type {
  RouteEstimateInput,
  RoutingSource,
  RoutingTrafficMode,
} from "@/types/transport-routing";
import { routingHonestyDisclaimer } from "@/types/transport-routing";

type CachedEstimateRow = TransportRouteEstimate;

function jsonInput(value: Prisma.JsonValue | null): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined;
  return value as Prisma.InputJsonValue;
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

async function plannedCacheIdentity(
  requested: TransportRoutingProvider,
  input: RouteEstimateInput
): Promise<{ provider: TransportRoutingProvider; trafficMode: RoutingTrafficMode }> {
  if (requested === "tomtom") {
    if (!transportRoutingConfig.tomtomApiKey || (await isTomTomDailyCapReached())) {
      return { provider: "osrm", trafficMode: "none" };
    }
    return {
      provider: "tomtom",
      trafficMode: resolveTomTomTrafficModeForInput(input),
    };
  }
  return {
    provider: requested === "disabled" ? "mock" : requested,
    trafficMode: input.routeOptions?.trafficMode ?? "none",
  };
}

function parseDepartAt(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function persistTripEstimate(params: {
  cached: CachedEstimateRow;
  tripId: string;
  travelDurationSeconds: number;
  boardingBufferSeconds: number;
  departAt: Date | null;
  trafficAdvisory?: TrafficAdvisory;
}): Promise<TransportRouteEstimate> {
  const existing = await prisma.transportRouteEstimate.findFirst({
    where: {
      cacheKey: params.cached.cacheKey,
      tripId: params.tripId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (
    existing &&
    existing.boardingBufferSeconds === params.boardingBufferSeconds &&
    (existing.travelDurationSeconds ?? providerTravelSeconds(existing)) ===
      params.travelDurationSeconds
  ) {
    return existing;
  }

  return prisma.transportRouteEstimate.create({
    data: {
      tripId: params.tripId,
      provider: params.cached.provider,
      distanceMetres: params.cached.distanceMetres,
      durationSeconds:
        params.travelDurationSeconds + params.boardingBufferSeconds,
      travelDurationSeconds: params.travelDurationSeconds,
      boardingBufferSeconds: params.boardingBufferSeconds,
      advisoryOnly: true,
      cacheKey: params.cached.cacheKey,
      rawResponse: jsonInput(params.cached.rawResponse),
      expiresAt: params.cached.expiresAt,
      source: params.cached.source,
      trafficMode: params.cached.trafficMode,
      liveTrafficUsed: params.cached.liveTrafficUsed,
      providerStatus: params.cached.providerStatus,
      fallbackReason: params.cached.fallbackReason,
      generatedAt: params.cached.generatedAt,
      departAt: params.departAt ?? params.cached.departAt,
      geometryJson: jsonInput(params.cached.geometryJson),
      hazardEvidence: params.trafficAdvisory
        ? permittedHazardEvidence(params.trafficAdvisory)
        : jsonInput(params.cached.hazardEvidence),
    },
  });
}

async function composeFromCached(params: {
  cached: CachedEstimateRow;
  tripId?: string;
  boardingBufferSeconds: number;
  input: RouteEstimateInput;
}): Promise<{
  estimate: TransportRouteEstimate;
  advisoryDisclaimer: string;
  fromCache: true;
  trafficAdvisory?: TrafficAdvisory;
}> {
  const travel = providerTravelSeconds(params.cached);
  const trafficAdvisory = await maybeTrafficAdvisory(
    params.input,
    geometryFromJson(params.cached.geometryJson)
  );
  const departAt = parseDepartAt(params.input.departAt);
  const estimate = params.tripId
    ? await persistTripEstimate({
        cached: params.cached,
        tripId: params.tripId,
        travelDurationSeconds: travel,
        boardingBufferSeconds: params.boardingBufferSeconds,
        departAt,
        trafficAdvisory,
      })
    : {
        ...params.cached,
        tripId: null,
        travelDurationSeconds: travel,
        boardingBufferSeconds: params.boardingBufferSeconds,
        durationSeconds: travel + params.boardingBufferSeconds,
        departAt: departAt ?? params.cached.departAt,
      };

  return {
    estimate,
    advisoryDisclaimer: routingHonestyDisclaimer({
      liveTrafficUsed: params.cached.liveTrafficUsed,
      source: (params.cached.source as RoutingSource) ?? "mock",
    }),
    fromCache: true,
    ...(trafficAdvisory ? { trafficAdvisory } : {}),
  };
}

export async function createRouteEstimate(params: {
  input: RouteEstimateInput;
  tripId?: string;
  provider?: TransportRoutingProvider;
  boardingBufferSeconds?: number;
  sensitiveOrigin?: boolean;
}) {
  const requested = params.provider ?? transportRoutingConfig.provider;
  if (requested === "disabled" && process.env.NODE_ENV === "production") {
    throw new TransportApiError("TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE");
  }

  const input: RouteEstimateInput = {
    ...params.input,
    includeGeometry: params.input.includeGeometry ?? true,
  };
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

  const cached = await getCachedEstimate(cacheKey);
  const cachedGeometry = cached
    ? geometryFromJson(cached.geometryJson)
    : undefined;
  const cacheUsable =
    Boolean(cached) &&
    (input.includeGeometry === false || Boolean(cachedGeometry?.length));
  if (cached && cacheUsable) {
    return composeFromCached({
      cached,
      tripId: params.tripId,
      boardingBufferSeconds,
      input,
    });
  }

  const executed = await executeRouteEstimate({
    input,
    provider: requested,
    sensitiveOrigin: params.sensitiveOrigin,
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

  const expiresAt = new Date(
    Date.parse(executed.result.validUntil) ||
      Date.now() + estimateTtlMs(executed.result.liveTrafficUsed)
  );
  const generatedAt = new Date(executed.result.generatedAt);
  const departAt = parseDepartAt(input.departAt);
  const travel = executed.result.travelDurationSeconds;
  const trafficAdvisory = await maybeTrafficAdvisory(
    input,
    executed.result.geometry
  );

  const providerSnapshot = await prisma.transportRouteEstimate.create({
    data: {
      tripId: null,
      provider: executed.provider,
      distanceMetres: executed.result.distanceMetres,
      durationSeconds: travel,
      travelDurationSeconds: travel,
      boardingBufferSeconds: 0,
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
      generatedAt,
      departAt,
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
        estimateId: providerSnapshot.id,
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
    providerSnapshot.id,
    estimateTtlMs(executed.result.liveTrafficUsed)
  );

  const estimate = params.tripId
    ? await persistTripEstimate({
        cached: providerSnapshot,
        tripId: params.tripId,
        travelDurationSeconds: travel,
        boardingBufferSeconds,
        departAt,
        trafficAdvisory,
      })
    : {
        ...providerSnapshot,
        boardingBufferSeconds,
        durationSeconds: travel + boardingBufferSeconds,
      };

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
