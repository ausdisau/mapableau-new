import { describe, expect, it } from "vitest";

import type { Provider } from "@/app/provider-finder/providers";
import {
  enrichProvidersWithDistance,
  filterProvidersByRadius,
  sortProviders,
} from "@/lib/provider-finder/provider-search-service";
import { providerSearchQuerySchema } from "@/lib/validation/provider-search-schemas";

const baseProvider = (overrides: Partial<Provider>): Provider => ({
  id: "p1",
  slug: "test",
  name: "Test Provider",
  suburb: "Sydney",
  state: "NSW",
  postcode: "2000",
  distanceKm: 0,
  rating: 4,
  reviewCount: 10,
  registered: true,
  categories: ["Support Coordination"],
  supports: ["In-person"],
  latitude: -33.8688,
  longitude: 151.2093,
  ...overrides,
});

describe("provider distance search", () => {
  const userLat = -33.8688;
  const userLng = 151.2093;

  it("enriches providers with distance labels", () => {
    const enriched = enrichProvidersWithDistance(
      [baseProvider({})],
      userLat,
      userLng,
    );
    expect(enriched[0].distanceLabel).toMatch(/away/);
    expect(enriched[0].distanceKind).toBe("exact");
  });

  it("filters providers outside radius", () => {
    const near = baseProvider({ id: "near", latitude: -33.87, longitude: 151.21 });
    const far = baseProvider({
      id: "far",
      latitude: -37.81,
      longitude: 144.96,
    });
    const enriched = enrichProvidersWithDistance([near, far], userLat, userLng);
    const filtered = filterProvidersByRadius(enriched, userLat, userLng, 5);
    expect(filtered.some((p) => p.id === "near")).toBe(true);
    expect(filtered.some((p) => p.id === "far")).toBe(false);
  });

  it("sorts by distance ascending", () => {
    const a = baseProvider({ id: "a", latitude: -33.87, longitude: 151.21 });
    const b = baseProvider({ id: "b", latitude: -33.9, longitude: 151.25 });
    const enriched = enrichProvidersWithDistance([b, a], userLat, userLng);
    const sorted = sortProviders(enriched, "distance");
    expect(sorted[0].id).toBe("a");
  });
});

describe("providerSearchQuerySchema", () => {
  it("rejects invalid latitude", () => {
    const parsed = providerSearchQuerySchema.safeParse({ lat: 999, lng: 151 });
    expect(parsed.success).toBe(false);
  });

  it("rejects radius over allowed set", () => {
    const parsed = providerSearchQuerySchema.safeParse({
      lat: -33,
      lng: 151,
      radiusKm: 200,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid distance search params", () => {
    const parsed = providerSearchQuerySchema.safeParse({
      lat: -33.87,
      lng: 151.2,
      radiusKm: 25,
      sort: "distance",
    });
    expect(parsed.success).toBe(true);
  });
});
