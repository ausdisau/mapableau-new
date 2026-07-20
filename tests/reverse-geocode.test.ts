import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

vi.stubGlobal("fetch", fetchMock);

import { reverseGeocodeCoordinates } from "@/lib/map/nominatim-server";

describe("reverseGeocodeCoordinates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENSTREETMAP_ENABLED = "true";
  });

  it("returns postcode and suburb from Nominatim reverse response", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        display_name: "Parramatta NSW 2150, Australia",
        address: {
          postcode: "2150",
          suburb: "Parramatta",
          state: "New South Wales",
        },
      }),
    });

    const result = await reverseGeocodeCoordinates(-33.815, 151.0);
    expect(result).toEqual({
      postcode: "2150",
      suburb: "Parramatta",
      state: "New South Wales",
      displayName: "Parramatta NSW 2150, Australia",
    });

    const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("/reverse");
    expect(calledUrl).toContain("lat=-33.815");
    expect(calledUrl).toContain("lon=151");
  });

  it("returns null when OpenStreetMap is disabled", async () => {
    process.env.OPENSTREETMAP_ENABLED = "false";
    const result = await reverseGeocodeCoordinates(-33.815, 151.0);
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("reverseGeocode client helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls same-origin reverse geocode API", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        postcode: "2150",
        suburb: "Parramatta",
        state: "New South Wales",
        displayName: "Parramatta NSW 2150, Australia",
      }),
    });

    const { reverseGeocode } = await import("@/lib/geo");
    const result = await reverseGeocode(-33.815, 151.0);

    expect(result.postcode).toBe("2150");
    const calledUrl = fetchMock.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("/api/geo/reverse");
  });
});
