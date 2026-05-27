import { describe, expect, it } from "vitest";

import { bboxFromCenter, bboxToSearchParams } from "@/lib/map/bbox-from-center";

describe("bboxFromCenter", () => {
  it("returns a box centered on Sydney for 50km radius", () => {
    const bbox = bboxFromCenter(-33.8688, 151.2093, 50);
    expect(bbox.minLat).toBeLessThan(-33.8688);
    expect(bbox.maxLat).toBeGreaterThan(-33.8688);
    expect(bbox.minLng).toBeLessThan(151.2093);
    expect(bbox.maxLng).toBeGreaterThan(151.2093);
  });

  it("serializes to search params", () => {
    const bbox = bboxFromCenter(-33.87, 151.21, 10);
    const params = bboxToSearchParams(bbox);
    expect(params.get("minLat")).toBe(String(bbox.minLat));
    expect(params.get("maxLng")).toBe(String(bbox.maxLng));
  });
});
