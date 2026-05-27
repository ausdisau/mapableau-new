import { describe, expect, it } from "vitest";

import {
  providersToGeoJSON,
  tripsToLineGeoJSON,
  tripsToStopsGeoJSON,
} from "@/lib/map/map-feature-query";

describe("map-feature-query", () => {
  it("builds provider point features with ids", () => {
    const fc = providersToGeoJSON([
      { id: "p1", name: "Acme", lat: -33.87, lng: 151.21 },
    ]);
    expect(fc.features).toHaveLength(1);
    expect(fc.features[0]?.properties?.id).toBe("p1");
  });

  it("builds trip line and stop features", () => {
    const trip = {
      id: "t1",
      pickupLat: -33.87,
      pickupLng: 151.2,
      dropoffLat: -33.88,
      dropoffLng: 151.22,
      pickupSuburb: "Parramatta",
      dropoffSuburb: "Sydney",
    };
    const lines = tripsToLineGeoJSON([trip]);
    expect(lines.features[0]?.geometry.type).toBe("LineString");

    const stops = tripsToStopsGeoJSON([trip]);
    expect(stops.features).toHaveLength(2);
    expect(stops.features[0]?.properties?.stopType).toBe("pickup");
  });
});
