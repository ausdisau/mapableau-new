import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/geocode/route";
import {
  geocodeAddress,
  GeocodingProviderError,
} from "@/lib/map/geocoding-service";

vi.mock("@/lib/map/geocoding-service", () => {
  class GeocodingProviderError extends Error {
    constructor(message = "Geocoding provider unavailable") {
      super(message);
      this.name = "GeocodingProviderError";
    }
  }

  return {
    geocodeAddress: vi.fn(),
    GeocodingProviderError,
  };
});

const mockedGeocodeAddress = vi.mocked(geocodeAddress);

describe("GET /api/geocode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects query shorter than 2 characters", async () => {
    const res = await GET(new Request("http://localhost/api/geocode?q=a"));

    expect(res.status).toBe(400);
    expect(mockedGeocodeAddress).not.toHaveBeenCalled();
  });

  it("returns geocoding results for a valid query", async () => {
    mockedGeocodeAddress.mockResolvedValue([
      {
        id: "nominatim-123",
        label: "Parramatta NSW, Australia",
        latitude: -33.8148,
        longitude: 151.0033,
        provider: "nominatim",
        address: {
          suburb: "Parramatta",
          state: "New South Wales",
          postcode: "2150",
          country: "AU",
        },
      },
    ]);

    const res = await GET(
      new Request(
        "http://localhost/api/geocode?q=%20Parramatta%20NSW%20&limit=2&country=nz",
      ),
    );

    expect(res.status).toBe(200);
    expect(mockedGeocodeAddress).toHaveBeenCalledWith({
      query: "Parramatta NSW",
      limit: 2,
      country: "NZ",
    });
    await expect(res.json()).resolves.toEqual({
      results: [
        {
          id: "nominatim-123",
          label: "Parramatta NSW, Australia",
          latitude: -33.8148,
          longitude: 151.0033,
          provider: "nominatim",
          address: {
            suburb: "Parramatta",
            state: "New South Wales",
            postcode: "2150",
            country: "AU",
          },
        },
      ],
    });
  });

  it("returns a safe 503 when the provider is unavailable", async () => {
    mockedGeocodeAddress.mockRejectedValue(
      new GeocodingProviderError("upstream details should not leak"),
    );

    const res = await GET(
      new Request("http://localhost/api/geocode?q=Parramatta%20NSW"),
    );

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({
      error: "Geocoding service unavailable",
    });
  });
});
