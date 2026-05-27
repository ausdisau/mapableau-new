import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/map/layers/access/route";

vi.mock("@/lib/map/layers/access-map-layer-service", () => ({
  getAccessMapLayerGeoJson: vi.fn(async () => ({
    type: "FeatureCollection",
    features: [{ type: "Feature", id: "a1", geometry: { type: "Point", coordinates: [151.2, -33.87] }, properties: {} }],
  })),
}));

describe("GET /api/map/layers/access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires bbox params", async () => {
    const res = await GET(new Request("http://localhost/api/map/layers/access"));
    expect(res.status).toBe(400);
  });

  it("returns geojson for valid bbox", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/map/layers/access?minLat=-34&minLng=150&maxLat=-33&maxLng=152",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("FeatureCollection");
    expect(body.features).toHaveLength(1);
  });
});
