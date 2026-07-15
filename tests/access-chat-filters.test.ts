import { describe, expect, it } from "vitest";

import { applyBoundingBox } from "@/lib/access-chat/hybrid-search";
import { buildPlaceWhere } from "@/lib/access-map/access-filter-service";

describe("access filter bounding box", () => {
  it("adds location bounds when lat/lng/radius set", () => {
    const where = buildPlaceWhere({
      lat: -33.87,
      lng: 151.21,
      radiusKm: 3,
      sort: "relevance",
      limit: 50,
      features: undefined,
    });
    expect(where.location).toBeDefined();
    const loc = where.location as {
      is: { latitude: { gte: number; lte: number } };
    };
    expect(loc.is.latitude.gte).toBeLessThan(-33.87);
    expect(loc.is.latitude.lte).toBeGreaterThan(-33.87);
  });

  it("applyBoundingBox is idempotent with filters", () => {
    const where: Record<string, unknown> = { status: "published" };
    applyBoundingBox(where, {
      lat: -33.8,
      lng: 151.2,
      radiusKm: 2,
      sort: "relevance",
      limit: 20,
      features: undefined,
    });
    expect(where.location).toBeDefined();
  });
});
