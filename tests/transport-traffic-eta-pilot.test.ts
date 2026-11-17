import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { boardingBufferSecondsForMobility } from "@/lib/transport/routing/boarding-buffer";
import {
  buildRouteCacheKey,
  clearRouteMemoryCacheForTests,
  expireEstimatesForTrip,
  getCachedEstimate,
  rememberEstimate,
  timeBucketIso,
} from "@/lib/transport/routing/route-cache-service";
import { estimateTtlMs } from "@/lib/transport/routing/routing-provenance";
import {
  mapTomTomRouteResponse,
  TomTomOrbisRoutingAdapter,
} from "@/lib/transport/routing/tomtom-orbis-routing-adapter";
import { composePickupEtaIso } from "@/lib/transport/routing/traffic-aware-eta-service";
import { mockRoutingAdapter } from "@/lib/transport/routing/mock-routing-adapter";

const origin = { lat: -33.86881, lng: 151.2093 };
const destination = { lat: -33.88001, lng: 151.22009 };
const waypoint = { lat: -33.87555, lng: 151.21501 };

const driverUser: CurrentUser = {
  id: "driver-user-1",
  email: "driver@test.com",
  name: "Driver",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "driver",
  roles: ["driver"],
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportRouteEstimate: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    transportRoutingDailyUsage: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    transportTrip: { findUnique: vi.fn() },
    transportDispatchAssignment: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    transportDriver: { findFirst: vi.fn() },
    transportLiveLocation: { create: vi.fn(), findFirst: vi.fn() },
    transportTripEvent: { create: vi.fn() },
    consentRecord: { findFirst: vi.fn() },
    dataAccessLog: { create: vi.fn() },
    organisationMember: { findMany: vi.fn() },
    notificationPreference: { findFirst: vi.fn() },
    notification: { create: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

describe("route cache key", () => {
  it("includes provider, traffic mode, options, time bucket, waypoints and rounded coords", () => {
    const key = buildRouteCacheKey({
      provider: "tomtom",
      origin,
      destination,
      waypoints: [waypoint],
      departAt: "2026-06-01T09:07:00.000Z",
      routeOptions: { trafficMode: "historical", routeType: "fast", avoid: ["tolls"] },
    });
    expect(key).toContain("tomtom|historical|");
    expect(key).toContain("fast:tolls");
    expect(key).toContain(timeBucketIso("2026-06-01T09:07:00.000Z"));
    expect(key).toContain("-33.87555,151.21501");

    const withoutWaypoint = buildRouteCacheKey({
      provider: "tomtom",
      origin,
      destination,
      departAt: "2026-06-01T09:07:00.000Z",
      routeOptions: { trafficMode: "historical", routeType: "fast", avoid: ["tolls"] },
    });
    expect(withoutWaypoint).not.toBe(key);

    const otherOptions = buildRouteCacheKey({
      provider: "tomtom",
      origin,
      destination,
      waypoints: [waypoint],
      departAt: "2026-06-01T09:07:00.000Z",
      routeOptions: { trafficMode: "historical", routeType: "short" },
    });
    expect(otherOptions).not.toBe(key);

    const otherBucket = buildRouteCacheKey({
      provider: "tomtom",
      origin,
      destination,
      waypoints: [waypoint],
      departAt: "2026-06-01T09:22:00.000Z",
      routeOptions: { trafficMode: "historical", routeType: "fast", avoid: ["tolls"] },
    });
    expect(otherBucket).not.toBe(key);
  });

  it("does not put boarding buffers in the cache key", () => {
    const a = buildRouteCacheKey({
      provider: "osrm",
      origin,
      destination,
      routeOptions: { trafficMode: "none" },
    });
    expect(a).not.toMatch(/boarding|600|buffer/i);
  });
});

describe("cache TTL and expiry", () => {
  beforeEach(() => {
    clearRouteMemoryCacheForTests();
    vi.mocked(prisma.transportRouteEstimate.findUnique).mockReset();
    vi.mocked(prisma.transportRouteEstimate.findFirst).mockReset();
    vi.mocked(prisma.transportRouteEstimate.updateMany).mockReset();
  });

  it("uses 3 minutes for live traffic and 15 minutes otherwise", () => {
    expect(estimateTtlMs(true)).toBe(3 * 60 * 1000);
    expect(estimateTtlMs(false)).toBe(15 * 60 * 1000);
  });

  it("ignores expired database rows", async () => {
    vi.mocked(prisma.transportRouteEstimate.findFirst).mockResolvedValue({
      id: "est-old",
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
    } as never);
    const row = await getCachedEstimate("tomtom|none|fast:|bucket|a|b");
    expect(row).toBeNull();
  });

  it("expireEstimatesForTrip updates rows and clears memory", async () => {
    rememberEstimate("k1", "est-1", 60_000, "trip-1");
    vi.mocked(prisma.transportRouteEstimate.updateMany).mockResolvedValue({
      count: 1,
    });
    await expireEstimatesForTrip("trip-1");
    expect(prisma.transportRouteEstimate.updateMany).toHaveBeenCalled();
    vi.mocked(prisma.transportRouteEstimate.findUnique).mockResolvedValue({
      id: "est-1",
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    const cached = await getCachedEstimate("k1");
    expect(cached).toBeNull();
  });
});

describe("TomTom Orbis mapping", () => {
  const tomtomBody = {
    routes: [
      {
        summary: {
          lengthInMeters: 4200,
          travelTimeInSeconds: 780,
          trafficDelayInSeconds: 90,
        },
        legs: [
          {
            summary: { lengthInMeters: 4200, travelTimeInSeconds: 780 },
            points: [
              { latitude: -33.8688, longitude: 151.2093 },
              { latitude: -33.88, longitude: 151.22 },
            ],
          },
        ],
      },
    ],
  };

  it("maps official calculateRoute fields and never claims live unless live mode applied", () => {
    const result = mapTomTomRouteResponse(
      tomtomBody,
      { origin, destination },
      "historical"
    );
    expect(result.distanceMetres).toBe(4200);
    expect(result.travelDurationSeconds).toBe(780);
    expect(result.source).toBe("tomtom_orbis");
    expect(result.liveTrafficUsed).toBe(false);
    expect(result.advisoryOnly).toBe(true);
  });

  it("sets liveTrafficUsed only for successful live traffic mode", () => {
    const live = mapTomTomRouteResponse(
      tomtomBody,
      { origin, destination },
      "live"
    );
    expect(live.liveTrafficUsed).toBe(true);
    expect(live.trafficModeApplied).toBe("live");
  });

  it("sends historical traffic when live flags are off", async () => {
    vi.stubEnv("TRANSPORT_TRAFFIC_AWARE_ENABLED", "false");
    vi.stubEnv("TRANSPORT_TOMTOM_TRAFFIC_LIVE", "false");
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => tomtomBody,
    });
    const adapter = new TomTomOrbisRoutingAdapter("test-key", fetchImpl);
    const result = await adapter.estimateRoute({ origin, destination });
    expect(result.liveTrafficUsed).toBe(false);
    const calledUrl = String(fetchImpl.mock.calls[0]?.[0]);
    expect(calledUrl).toContain("traffic=historical");
    expect(calledUrl).not.toContain("key=");
    expect(fetchImpl.mock.calls[0]?.[1]?.headers?.["TomTom-Api-Key"]).toBe(
      "test-key"
    );
    vi.unstubAllEnvs();
  });
});

describe("TomTom live flags and fallback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("resolveTomTomTrafficMode is historical when live flags are off", async () => {
    vi.resetModules();
    vi.stubEnv("TRANSPORT_TRAFFIC_AWARE_ENABLED", "false");
    vi.stubEnv("TRANSPORT_TOMTOM_TRAFFIC_LIVE", "false");
    vi.stubEnv("TOMTOM_API_KEY", "abc");
    const { resolveTomTomTrafficMode: resolve } = await import(
      "@/lib/transport/routing/tomtom-orbis-routing-adapter"
    );
    expect(resolve()).toBe("historical");
  });

  it("falls back to labelled OSRM when the TomTom key is missing", async () => {
    vi.resetModules();
    vi.stubEnv("TRANSPORT_ROUTING_PROVIDER", "tomtom");
    vi.stubEnv("TOMTOM_API_KEY", "");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          routes: [
            { distance: 5000, duration: 600, legs: [{ distance: 5000, duration: 600 }] },
          ],
        }),
      })
    );
    const { executeRouteEstimate } = await import(
      "@/lib/transport/routing/routing-estimate-executor"
    );
    const executed = await executeRouteEstimate({
      input: { origin, destination },
      provider: "tomtom",
    });
    expect(executed.provider).toBe("osrm");
    expect(executed.result.liveTrafficUsed).toBe(false);
    expect(executed.result.providerStatus).toBe("misconfigured");
    expect(executed.result.fallbackReason).toBe("tomtom_missing_key");
  });

  it("falls back with cost_limited when the daily cap is reached", async () => {
    vi.resetModules();
    vi.stubEnv("TRANSPORT_ROUTING_PROVIDER", "tomtom");
    vi.stubEnv("TOMTOM_API_KEY", "present");
    vi.stubEnv("TRANSPORT_TOMTOM_DAILY_REQUEST_CAP", "200");
    vi.mocked(prisma.transportRoutingDailyUsage.findUnique).mockResolvedValue({
      requestCount: 200,
    } as never);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          routes: [
            { distance: 5000, duration: 600, legs: [{ distance: 5000, duration: 600 }] },
          ],
        }),
      })
    );
    const { executeRouteEstimate } = await import(
      "@/lib/transport/routing/routing-estimate-executor"
    );
    const executed = await executeRouteEstimate({
      input: { origin, destination },
      provider: "tomtom",
    });
    expect(executed.result.providerStatus).toBe("cost_limited");
    expect(executed.result.fallbackReason).toBe("tomtom_daily_cap");
    expect(executed.result.liveTrafficUsed).toBe(false);
    expect(executed.provider).toBe("osrm");
  });
});

describe("boarding buffers and pickup ETA", () => {
  it("defaults to 10 minutes and adds 10 minutes for extra boarding time", () => {
    expect(boardingBufferSecondsForMobility({})).toBe(600);
    expect(
      boardingBufferSecondsForMobility({ needsExtraBoardingTime: true })
    ).toBe(1200);
  });

  it("composes pickup ETA from departAt plus travel and boarding", () => {
    const iso = composePickupEtaIso({
      generatedAt: new Date("2026-06-01T08:00:00.000Z"),
      travelDurationSeconds: 300,
      boardingBufferSeconds: 600,
      departAt: new Date("2026-06-01T09:00:00.000Z"),
    });
    expect(iso).toBe("2026-06-01T09:15:00.000Z");
  });
});

describe("mock adapter honesty", () => {
  it("never claims live traffic", async () => {
    const result = await mockRoutingAdapter.estimateRoute({
      origin,
      destination,
    });
    expect(result.liveTrafficUsed).toBe(false);
    expect(result.source).toBe("mock");
  });
});

describe("driver location consent", () => {
  beforeEach(() => {
    vi.mocked(prisma.transportTrip.findUnique).mockReset();
    vi.mocked(prisma.transportDriver.findFirst).mockReset();
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockReset();
    vi.mocked(prisma.consentRecord.findFirst).mockReset();
    vi.mocked(prisma.transportLiveLocation.create).mockReset();
  });

  it("denies recording location without participant consent", async () => {
    const { phase4Config } = await import("@/lib/config/phase4");
    const previous = phase4Config.transportLiveLocationEnabled;
    phase4Config.transportLiveLocationEnabled = true;
    try {
      vi.mocked(prisma.transportDriver.findFirst).mockResolvedValue({
        id: "td-1",
        userId: driverUser.id,
      } as never);
      vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
        id: "trip-1",
        participantId: "participant-1",
        providerOrganisationId: "org-1",
        status: "en_route_to_pickup",
      } as never);
      vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue({
        id: "as-1",
        driverId: "td-1",
        driverLocationShareOptedIn: true,
        driver: { id: "td-1", userId: driverUser.id },
      } as never);
      vi.mocked(prisma.consentRecord.findFirst).mockResolvedValue(null);

      const { recordConsentedDriverLocation } = await import(
        "@/lib/transport/privacy/driver-location-share"
      );
      await expect(
        recordConsentedDriverLocation(driverUser, "trip-1", -33.87, 151.21)
      ).rejects.toMatchObject({ code: "TRANSPORT_CONSENT_REQUIRED" });
      expect(prisma.transportLiveLocation.create).not.toHaveBeenCalled();
    } finally {
      phase4Config.transportLiveLocationEnabled = previous;
    }
  });
});
