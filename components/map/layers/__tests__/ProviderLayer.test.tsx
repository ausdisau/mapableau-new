import { describe, expect, it, vi } from "vitest";

import { MAP_LAYERS, MAP_SOURCES } from "@/lib/map/map-layer-ids";
import { upsertGeoJsonSource, upsertLayer } from "@/lib/map/map-sources";

describe("ProviderLayer source/layer registration", () => {
  it("adds provider source and layers", () => {
    const map = {
      getSource: vi.fn(() => null),
      addSource: vi.fn(),
      getLayer: vi.fn(() => null),
      addLayer: vi.fn(),
    };

    upsertGeoJsonSource(map as never, MAP_SOURCES.providers, {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "p1",
          geometry: { type: "Point", coordinates: [151, -33] },
          properties: { id: "p1", name: "Demo Provider" },
        },
      ],
    });

    upsertLayer(map as never, {
      id: MAP_LAYERS.providersCircle,
      type: "circle",
      source: MAP_SOURCES.providers,
      paint: { "circle-radius": 8, "circle-color": "#2563eb" },
    });

    expect(map.addSource).toHaveBeenCalledWith(
      MAP_SOURCES.providers,
      expect.objectContaining({ type: "geojson" }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: MAP_LAYERS.providersCircle }),
      undefined,
    );
  });
});
