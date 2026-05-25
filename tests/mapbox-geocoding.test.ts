import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { GET as getForward } from "@/app/api/geocoding/forward/route";
import { GET as getReverse } from "@/app/api/geocoding/reverse/route";
import {
  parseMapboxFeature,
  mapboxPlaceToReverseResult,
  type MapboxGeocodeFeature,
} from "@/lib/geocoding/parse-mapbox-feature";
import { isMapboxGeocodingEnabled } from "@/lib/geocoding/mapbox-config";

const sydneyFeature: MapboxGeocodeFeature = {
  id: "place.123",
  place_name: "Sydney, New South Wales 2000, Australia",
  text: "Sydney",
  center: [151.2093, -33.8688],
  place_type: ["place"],
  context: [
    { id: "postcode.2000", text: "2000" },
    { id: "region.NSW", text: "New South Wales", short_code: "AU-NSW" },
    { id: "country.61", text: "Australia", short_code: "au" },
  ],
};

describe("parseMapboxFeature", () => {
  it("extracts suburb, state, postcode and coordinates", () => {
    const parsed = parseMapboxFeature(sydneyFeature);
    expect(parsed.suburb).toBe("Sydney");
    expect(parsed.state).toBe("NSW");
    expect(parsed.postcode).toBe("2000");
    expect(parsed.lat).toBeCloseTo(-33.8688, 4);
    expect(parsed.lng).toBeCloseTo(151.2093, 4);
  });

  it("maps to reverse geocode result shape", () => {
    const parsed = parseMapboxFeature(sydneyFeature);
    const reverse = mapboxPlaceToReverseResult(parsed);
    expect(reverse.postcode).toBe("2000");
    expect(reverse.suburb).toBe("Sydney");
    expect(reverse.state).toBe("NSW");
    expect(reverse.displayName).toContain("Sydney");
  });
});

describe("GET /api/geocoding/forward", () => {
  const prevToken = process.env.MAPBOX_ACCESS_TOKEN;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.MAPBOX_ACCESS_TOKEN;
  });

  afterEach(() => {
    if (prevToken) process.env.MAPBOX_ACCESS_TOKEN = prevToken;
    else delete process.env.MAPBOX_ACCESS_TOKEN;
  });

  it("returns 503 when Mapbox is not configured", async () => {
    expect(isMapboxGeocodingEnabled()).toBe(false);
    const res = await getForward(
      new Request("http://localhost/api/geocoding/forward?q=Sydney"),
    );
    expect(res.status).toBe(503);
  });

  it("rejects short queries", async () => {
    process.env.MAPBOX_ACCESS_TOKEN = "pk.test";
    const res = await getForward(
      new Request("http://localhost/api/geocoding/forward?q=a"),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/geocoding/reverse", () => {
  it("rejects invalid coordinates", async () => {
    const res = await getReverse(
      new Request("http://localhost/api/geocoding/reverse?lat=999&lng=0"),
    );
    expect(res.status).toBe(400);
  });
});
