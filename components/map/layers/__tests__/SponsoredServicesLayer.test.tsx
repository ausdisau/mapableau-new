import { describe, expect, it, vi } from "vitest";

import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { upsertGeoJsonSource, upsertLayer } from "@/lib/map/map-sources";

describe("SponsoredServicesLayer source/layer registration", () => {
  it("adds sponsored services source and layers", () => {
    const map = {
      getSource: vi.fn(() => null),
      addSource: vi.fn(),
      getLayer: vi.fn(() => null),
      addLayer: vi.fn(),
    };

    upsertGeoJsonSource(map as never, MAP_SOURCES.sponsoredServices, {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "ad-1",
          geometry: { type: "Point", coordinates: [151, -33] },
          properties: { id: "ad-1", headline: "Sponsored", isSponsored: true },
        },
      ],
    });

    upsertLayer(map as never, {
      id: MAP_LAYERS.sponsoredServicesCircle,
      type: "circle",
      source: MAP_SOURCES.sponsoredServices,
      paint: { "circle-radius": 10, "circle-color": "#b45309" },
    });

    expect(map.addSource).toHaveBeenCalledWith(
      MAP_SOURCES.sponsoredServices,
      expect.objectContaining({ type: "geojson" }),
    );
    expect(map.addLayer).toHaveBeenCalled();
  });
});
