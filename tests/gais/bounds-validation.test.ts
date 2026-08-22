import { describe, expect, it } from "vitest";

import {
  GAIS_MAX_BOUNDS_SPAN_DEGREES,
  gaisBoundsSchema,
} from "@/lib/gais/contracts/bounds";

describe("gais bounds validation", () => {
  it("accepts valid bounds", () => {
    const result = gaisBoundsSchema.safeParse({
      minLat: -34.0,
      minLng: 150.9,
      maxLat: -33.8,
      maxLng: 151.2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects inverted latitude", () => {
    const result = gaisBoundsSchema.safeParse({
      minLat: -33.0,
      minLng: 150.0,
      maxLat: -34.0,
      maxLng: 151.0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects pathological span", () => {
    const result = gaisBoundsSchema.safeParse({
      minLat: -40,
      minLng: 140,
      maxLat: -38,
      maxLng: 140 + GAIS_MAX_BOUNDS_SPAN_DEGREES + 0.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed coordinates", () => {
    const result = gaisBoundsSchema.safeParse({
      minLat: "north",
      minLng: 150,
      maxLat: -33,
      maxLng: 151,
    });
    expect(result.success).toBe(false);
  });

  it("caps limit to maximum", () => {
    const result = gaisBoundsSchema.safeParse({
      minLat: -34,
      minLng: 150,
      maxLat: -33.9,
      maxLng: 150.1,
      limit: 9999,
    });
    expect(result.success).toBe(false);
  });
});
