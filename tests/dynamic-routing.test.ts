import { describe, expect, it } from "vitest";

import {
  estimateRouteFromCoordinates,
  placeholderRouteEstimate,
} from "@/lib/routing/dynamic-route-service";

describe("dynamic routing estimates", () => {
  it("computes haversine distance between Sydney and Parramatta", () => {
    const estimate = estimateRouteFromCoordinates(
      { lat: -33.8688, lng: 151.2093 },
      { lat: -33.815, lng: 151.0011 },
    );
    expect(estimate.distanceKm).toBeGreaterThan(15);
    expect(estimate.distanceKm).toBeLessThan(25);
    expect(estimate.durationMinutes).toBeGreaterThanOrEqual(5);
    expect(estimate.source).toBe("coordinates");
  });

  it("returns placeholder when coordinates unavailable", () => {
    const p = placeholderRouteEstimate();
    expect(p.source).toBe("placeholder");
    expect(p.distanceKm).toBe(12);
    expect(p.durationMinutes).toBe(30);
  });
});

describe("dynamic routing config", () => {
  it("exports routing helpers", async () => {
    const mod = await import("@/lib/config/dynamic-routing");
    expect(typeof mod.isDynamicRoutingEnabled()).toBe("boolean");
    expect(typeof mod.getRouteProviderLabel()).toBe("string");
  });
});
