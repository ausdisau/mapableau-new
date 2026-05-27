import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/geocode/route";

vi.mock("@/lib/map/geocoding-service", () => ({
  geocodeAddress: vi.fn(async () => [
    {
      lat: -33.8688,
      lng: 151.2093,
      displayName: "Sydney NSW, Australia",
      suburb: "Sydney",
      state: "New South Wales",
      postcode: "2000",
    },
  ]),
}));

describe("GET /api/geocode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty query", async () => {
    const res = await GET(new Request("http://localhost/api/geocode?q="));
    expect(res.status).toBe(400);
  });

  it("returns geocode results", async () => {
    const res = await GET(
      new Request("http://localhost/api/geocode?q=Parramatta"),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].lat).toBe(-33.8688);
  });
});
