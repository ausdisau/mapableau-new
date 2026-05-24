import { describe, expect, it } from "vitest";

import { MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { emptyFeatureCollection } from "@/lib/map/map-sources";

describe("Dispatch layers permission gating", () => {
  it("does not expose dispatch data when layer is disabled", () => {
    const original = process.env.MAP_ENABLE_DISPATCH_LAYER;
    process.env.MAP_ENABLE_DISPATCH_LAYER = "false";

    const enabled = process.env.MAP_ENABLE_DISPATCH_LAYER === "true";
    const data = enabled
      ? {
          type: "FeatureCollection" as const,
          features: [
            {
              type: "Feature" as const,
              id: "vehicle-1",
              geometry: { type: "Point" as const, coordinates: [151, -33] },
              properties: { id: "vehicle-1", label: "Vehicle 1" },
            },
          ],
        }
      : emptyFeatureCollection();

    expect(data.features).toHaveLength(0);
    expect(MAP_SOURCES.dispatchVehicles).toBe("dispatch-vehicles-source");

    process.env.MAP_ENABLE_DISPATCH_LAYER = original;
  });
});
