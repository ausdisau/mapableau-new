import { describe, expect, it, vi, beforeEach } from "vitest";

import { fetchGeocode, GeocodeClientError } from "@/lib/map/geocode-client";

describe("fetchGeocode", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          results: [
            {
              lat: -33.87,
              lng: 151.21,
              displayName: "Parramatta NSW",
            },
          ],
        }),
      })),
    );
  });

  it("returns null for short queries", async () => {
    const result = await fetchGeocode("a");
    expect(result).toBeNull();
  });

  it("returns first result from API", async () => {
    const result = await fetchGeocode("Parramatta");
    expect(result?.displayName).toBe("Parramatta NSW");
  });

  it("throws on failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      })),
    );
    await expect(fetchGeocode("Sydney")).rejects.toBeInstanceOf(
      GeocodeClientError,
    );
  });
});
