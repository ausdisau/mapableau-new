import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { grantConsent } from "@/lib/consent/consent-service";
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

vi.mock("@/lib/consent/consent-service", () => ({
  checkConsent: vi.fn().mockResolvedValue(false),
  grantConsent: vi.fn().mockResolvedValue({ id: "consent-1" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportRouteEstimate: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    transportRouteSegment: { createMany: vi.fn() },
    transportRoutingDailyUsage: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    transportTrip: { findUnique: vi.fn() },
    transportDispatchAssignment: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    transportDriver: { findFirst: vi.fn() },
    transportLiveLocation: { create: vi.fn(), findFirst: vi.fn() },
    transportTripEvent: { create: vi.fn() },
    consentRecord: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
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

  it("expireEstimatesForTrip expires trip rows without dropping provider cache", async () => {
    rememberEstimate("k1", "est-shared", 60_000, "trip-1");
    vi.mocked(prisma.transportRouteEstimate.updateMany).mockResolvedValue({
      count: 1,
    });
    await expireEstimatesForTrip("trip-1");
    expect(prisma.transportRouteEstimate.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tripId: "trip-1" }),
      })
    );
    vi.mocked(prisma.transportRouteEstimate.findUnique).mockResolvedValue({
      id: "est-shared",
      tripId: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    const cached = await getCachedEstimate("k1");
    expect(cached?.id).toBe("est-shared");
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
    vi.mocked(prisma.transportRoutingDailyUsage.updateMany).mockResolvedValue({
      count: 0,
    });
    vi.mocked(prisma.transportRoutingDailyUsage.create).mockRejectedValue(
      Object.assign(new Error("unique"), { code: "P2002" })
    );
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

  it("does not send coordinates to the public OSRM demo in production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TRANSPORT_ROUTING_PROVIDER", "tomtom");
    vi.stubEnv("TOMTOM_API_KEY", "");
    vi.stubEnv("OSRM_BASE_URL", "http://router.project-osrm.org");
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    const { executeRouteEstimate } = await import(
      "@/lib/transport/routing/routing-estimate-executor"
    );
    await expect(
      executeRouteEstimate({
        input: { origin, destination },
        provider: "tomtom",
      })
    ).rejects.toMatchObject({ code: "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not send consented live origin to the public OSRM demo", async () => {
    vi.resetModules();
    vi.stubEnv("TRANSPORT_ROUTING_PROVIDER", "tomtom");
    vi.stubEnv("TOMTOM_API_KEY", "");
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    const { executeRouteEstimate } = await import(
      "@/lib/transport/routing/routing-estimate-executor"
    );
    await expect(
      executeRouteEstimate({
        input: { origin, destination },
        provider: "tomtom",
        sensitiveOrigin: true,
      })
    ).rejects.toMatchObject({ code: "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE" });
    expect(fetchImpl).not.toHaveBeenCalled();
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

describe("cache composition", () => {
  beforeEach(() => {
    clearRouteMemoryCacheForTests();
    vi.mocked(prisma.transportRouteEstimate.findUnique).mockReset();
    vi.mocked(prisma.transportRouteEstimate.findFirst).mockReset();
    vi.mocked(prisma.transportRouteEstimate.create).mockReset();
  });

  it("does not reuse another trip's boarding buffer or tripId from cache", async () => {
    const shared = {
      id: "est-shared",
      tripId: "trip-a",
      cacheKey: "osrm|none|fast:|bucket|a|-|b",
      provider: "osrm",
      distanceMetres: 1000,
      durationSeconds: 1500,
      travelDurationSeconds: 300,
      boardingBufferSeconds: 1200,
      liveTrafficUsed: false,
      source: "osrm",
      trafficMode: "none",
      providerStatus: "ok",
      fallbackReason: null,
      generatedAt: new Date("2026-06-01T08:00:00.000Z"),
      departAt: new Date("2026-06-01T09:00:00.000Z"),
      createdAt: new Date("2026-06-01T08:00:00.000Z"),
      expiresAt: new Date(Date.now() + 60_000),
      geometryJson: { points: [origin, destination] },
      hazardEvidence: null,
      rawResponse: null,
      advisoryOnly: true,
    };
    vi.mocked(prisma.transportRouteEstimate.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.transportRouteEstimate.findFirst)
      .mockResolvedValueOnce(shared as never)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.transportRouteEstimate.create).mockResolvedValue({
      id: "est-trip-b",
      tripId: "trip-b",
      cacheKey: shared.cacheKey,
      provider: "osrm",
      distanceMetres: 1000,
      durationSeconds: 900,
      travelDurationSeconds: 300,
      boardingBufferSeconds: 600,
      liveTrafficUsed: false,
      source: "osrm",
      trafficMode: "none",
      providerStatus: "ok",
      fallbackReason: null,
      generatedAt: shared.generatedAt,
      departAt: shared.departAt,
      createdAt: shared.createdAt,
      expiresAt: shared.expiresAt,
      geometryJson: shared.geometryJson,
      hazardEvidence: null,
      rawResponse: null,
      advisoryOnly: true,
    } as never);

    const { createRouteEstimate } = await import(
      "@/lib/transport/routing/route-estimate-service"
    );
    const result = await createRouteEstimate({
      input: { origin, destination, includeGeometry: true },
      tripId: "trip-b",
      boardingBufferSeconds: 600,
    });

    expect(result.fromCache).toBe(true);
    expect(result.estimate.tripId).toBe("trip-b");
    expect(result.estimate.boardingBufferSeconds).toBe(600);
    expect(result.estimate.travelDurationSeconds).toBe(300);
    expect(result.estimate.durationSeconds).toBe(900);
    expect(prisma.transportRouteEstimate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tripId: "trip-b",
          boardingBufferSeconds: 600,
          travelDurationSeconds: 300,
          durationSeconds: 900,
        }),
      })
    );
  });
});

describe("driver location consent", () => {
  const participantUser: CurrentUser = {
    id: "participant-1",
    email: "p@test.com",
    name: "Participant",
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: "participant",
    roles: ["participant"],
  };

  beforeEach(() => {
    vi.mocked(prisma.transportTrip.findUnique).mockReset();
    vi.mocked(prisma.transportDriver.findFirst).mockReset();
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockReset();
    vi.mocked(prisma.consentRecord.findFirst).mockReset();
    vi.mocked(prisma.transportLiveLocation.create).mockReset();
    vi.mocked(prisma.transportLiveLocation.findFirst).mockReset();
    vi.mocked(grantConsent).mockClear();
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

  it("binds location consent to the assigned driver and trip, not the organisation", async () => {
    vi.mocked(prisma.consentRecord.findFirst).mockResolvedValue(null);
    const { hasDriverLocationShareConsent } = await import(
      "@/lib/transport/privacy/driver-location-share"
    );
    const ok = await hasDriverLocationShareConsent({
      participantId: "participant-1",
      tripId: "trip-1",
      driverUserId: driverUser.id,
    });
    expect(ok).toBe(false);
    expect(prisma.consentRecord.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          grantedToUserId: driverUser.id,
          sourceAction: "transport.trip:trip-1",
        }),
      })
    );
  });

  it("does not grant organisation-wide location consent", async () => {
    vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
      id: "trip-1",
      participantId: participantUser.id,
      providerOrganisationId: "org-1",
      scheduledStart: new Date("2026-06-01T09:00:00.000Z"),
    } as never);
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue(
      null
    );
    const { grantTripDriverLocationConsent } = await import(
      "@/lib/transport/privacy/driver-location-share"
    );
    await expect(
      grantTripDriverLocationConsent(participantUser, "trip-1", true)
    ).rejects.toMatchObject({ code: "TRANSPORT_VALIDATION_FAILED" });
    expect(grantConsent).not.toHaveBeenCalled();
  });

  it("is idempotent when trip-bound worker consent already exists", async () => {
    vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
      id: "trip-1",
      participantId: participantUser.id,
      scheduledStart: new Date("2026-06-01T09:00:00.000Z"),
    } as never);
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue({
      id: "as-1",
      driver: { userId: driverUser.id },
    } as never);
    vi.mocked(prisma.consentRecord.findFirst).mockResolvedValue({
      id: "consent-existing",
    } as never);
    const { grantTripDriverLocationConsent } = await import(
      "@/lib/transport/privacy/driver-location-share"
    );
    await expect(
      grantTripDriverLocationConsent(participantUser, "trip-1", true)
    ).resolves.toEqual({ granted: true });
    expect(grantConsent).not.toHaveBeenCalled();
  });

  it("denies reading location without opt-in, in-service status, and current driver", async () => {
    const { phase4Config } = await import("@/lib/config/phase4");
    const previous = phase4Config.transportLiveLocationEnabled;
    phase4Config.transportLiveLocationEnabled = true;
    try {
      vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
        id: "trip-1",
        participantId: participantUser.id,
        providerOrganisationId: "org-1",
        status: "requested",
      } as never);
      const { getSharedDriverLocation } = await import(
        "@/lib/transport/privacy/driver-location-share"
      );
      await expect(
        getSharedDriverLocation(participantUser, "trip-1")
      ).rejects.toMatchObject({ code: "TRANSPORT_LOCATION_SHARE_DISABLED" });

      vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
        id: "trip-1",
        participantId: participantUser.id,
        providerOrganisationId: "org-1",
        status: "en_route_to_pickup",
      } as never);
      vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue({
        id: "as-1",
        driverId: "td-1",
        driverLocationShareOptedIn: false,
        driver: { id: "td-1", userId: driverUser.id },
      } as never);
      await expect(
        getSharedDriverLocation(participantUser, "trip-1")
      ).rejects.toMatchObject({ code: "TRANSPORT_LOCATION_SHARE_DISABLED" });
    } finally {
      phase4Config.transportLiveLocationEnabled = previous;
    }
  });
});
