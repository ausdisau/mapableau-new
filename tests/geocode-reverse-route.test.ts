import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/geocode/reverse/route";

vi.mock("@/lib/geocoding/reverse-geocode-service", () => ({
  reverseGeocodeCoordinates: vi.fn(async () => ({
    lat: -33.87,
    lng: 151.21,
    postcode: "2000",
    suburb: "Sydney",
    state: "NSW",
    displayName: "Sydney NSW, Australia",
  })),
}));

describe("GET /api/geocode/reverse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid coordinates", async () => {
    const res = await GET(
      new Request("http://localhost/api/geocode/reverse?lat=foo&lng=1"),
    );
    expect(res.status).toBe(400);
  });

  it("returns postcode and suburb for valid coordinates", async () => {
    const res = await GET(
      new Request("http://localhost/api/geocode/reverse?lat=-33.87&lng=151.21"),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      postcode: string;
      suburb: string;
      state: string;
    };
    expect(body.postcode).toBe("2000");
    expect(body.suburb).toBe("Sydney");
    expect(body.state).toBe("NSW");
  });
});
