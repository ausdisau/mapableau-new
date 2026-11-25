import { describe, expect, it, vi } from "vitest";

import {
  GET,
  OPTIONS,
} from "@/app/api/transport/driver-practice/estimate/route";
import { shouldRunAuthMiddleware } from "@/lib/community/mapable-peers/peer-middleware";
import { avTripTransitionAllowed } from "@/lib/platform/av-framework/trip-transitions";
import { publicCorridorEstimate } from "@/lib/transport/driver-practice/estimate-service";
import { stages } from "@/lib/transport/driver-practice/journey";

describe("driver app entry points", () => {
  it("allows only the public practice path", () => {
    expect(shouldRunAuthMiddleware("/transport/drivers")).toBe(false);
    expect(shouldRunAuthMiddleware("/transport/drivers/")).toBe(false);
    for (const p of [
      "/transport/drivers/assigned",
      "/transport/driver",
      "/transport/drivers-other",
      "/driver/trips",
    ])
      expect(shouldRunAuthMiddleware(p)).toBe(true);
  });
  it("keeps driver practice aligned with canonical commands", () => {
    stages
      .slice(1)
      .forEach((s, i) =>
        expect(
          avTripTransitionAllowed(stages[i]!.id, s.id, { driverOnly: i !== 0 }),
        ).toBe(true),
      );
  });
  it("accepts only a named public corridor", async () => {
    for (const query of [
      "",
      "corridor=elsewhere",
      "corridor=park-aquatic&lat=9",
      "corridor=park-aquatic&corridor=park-library",
    ])
      expect(
        (await GET(new Request("https://example.invalid/?" + query))).status,
      ).toBe(400);
  });
  it("allows credential-free reads of practice estimates from standalone web origins", async () => {
    const endpoint =
      "https://mapable.com.au/api/transport/driver-practice/estimate";
    const origin = { Origin: "http://localhost:8081" };
    const preflight = OPTIONS();
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, HEAD, OPTIONS",
    );
    expect(preflight.headers.get("Access-Control-Allow-Headers")).toBe(
      "Accept",
    );
    vi.stubEnv("MAPABLE_DRIVER_PRACTICE_ROUTING_ENABLED", "false");
    try {
      const estimate = await GET(
        new Request(endpoint + "?corridor=park-library", { headers: origin }),
      );
      const unknown = await GET(
        new Request(endpoint + "?corridor=private", { headers: origin }),
      );
      expect(estimate.status).toBe(503);
      expect(unknown.status).toBe(400);
      for (const response of [preflight, estimate, unknown]) {
        expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
        expect(response.headers.has("Access-Control-Allow-Credentials")).toBe(
          false,
        );
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("reuses a dated estimate across instances and skips Mapbox when Redis is unavailable", async () => {
    let stored: string | null = null;
    const lookup = vi.fn().mockResolvedValue({ duration: 300, distance: 900 });
    const redis = vi.fn(async (args: string[]) => {
      if (args[0] === "GET") return stored;
      if (args.includes("NX")) return "OK";
      stored = args[2]!;
      return "OK";
    });
    const deps = { clock: () => 1700000000000, lookup, redis };
    const first = await publicCorridorEstimate("park-library", deps);
    expect(first?.distanceMetres).toBe(900);
    expect(await publicCorridorEstimate("park-library", deps)).toEqual(first);
    expect(lookup).toHaveBeenCalledTimes(1);
    await expect(
      publicCorridorEstimate("park-library", {
        ...deps,
        redis: async () => {
          throw new Error("offline");
        },
      }),
    ).rejects.toThrow("offline");
    expect(lookup).toHaveBeenCalledTimes(1);
  });
  it("does not use expired values, malformed data or an occupied refresh lease", async () => {
    for (const cache of [
      "{",
      JSON.stringify({
        source: "Mapbox Directions",
        distanceMetres: 10,
        durationSeconds: 3,
        generatedAt: "2020-01-01T01:00:00.000Z",
        validUntil: "2020-01-01T01:02:00.000Z",
      }),
    ]) {
      const lookup = vi.fn();
      const v = await publicCorridorEstimate("aquatic-park", {
        clock: Date.now,
        lookup,
        redis: async (args) => (args[0] === "GET" ? cache : null),
      });
      expect(v).toBeNull();
      expect(lookup).not.toHaveBeenCalled();
    }
  });
});
