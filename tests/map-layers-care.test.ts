import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/map/layers/care/route";

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(async () => ({ id: "user-1", primaryRole: "participant" })),
}));

vi.mock("@/lib/map/layers/care-map-layer-service", () => ({
  getCareMapLayerGeoJson: vi.fn(async () => ({
    type: "FeatureCollection",
    features: [],
  })),
}));

describe("GET /api/map/layers/care", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication", async () => {
    const { requireApiSession } = await import("@/lib/api/auth-handler");
    vi.mocked(requireApiSession).mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    );

    const res = await GET(
      new Request(
        "http://localhost/api/map/layers/care?minLat=-34&minLng=150&maxLat=-33&maxLng=152",
      ),
    );
    expect(res.status).toBe(401);
  });

  it("returns geojson when signed in", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/map/layers/care?minLat=-34&minLng=150&maxLat=-33&maxLng=152",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("FeatureCollection");
  });
});
