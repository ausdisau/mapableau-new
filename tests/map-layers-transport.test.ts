import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/map/layers/transport/route";

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(async () => ({ id: "user-1", primaryRole: "participant" })),
}));

vi.mock("@/lib/map/layers/transport-map-layer-service", () => ({
  getTransportMapLayerGeoJson: vi.fn(async () => ({
    lines: { type: "FeatureCollection", features: [] },
    stops: { type: "FeatureCollection", features: [] },
  })),
}));

describe("GET /api/map/layers/transport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns lines and stops when signed in", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/map/layers/transport?minLat=-34&minLng=150&maxLat=-33&maxLng=152",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lines.type).toBe("FeatureCollection");
    expect(body.stops.type).toBe("FeatureCollection");
  });
});
