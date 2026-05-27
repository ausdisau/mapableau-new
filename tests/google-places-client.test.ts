import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchGooglePlaceAutocomplete } from "@/lib/geocoding/google-places-client";

describe("fetchGooglePlaceAutocomplete", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    vi.stubEnv("GOOGLE_MAPS_REGION", "au");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns empty when query is too short", async () => {
    const results = await fetchGooglePlaceAutocomplete("a", 5);
    expect(results).toEqual([]);
  });

  it("requests AU-restricted autocomplete and maps suggestions", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            placePrediction: {
              placeId: "ChIJtest",
              text: { text: "Parramatta NSW, Australia" },
              structuredFormat: {
                mainText: { text: "Parramatta" },
                secondaryText: { text: "NSW, Australia" },
              },
            },
          },
        ],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const results = await fetchGooglePlaceAutocomplete("parra", 5);
    expect(results).toHaveLength(1);
    expect(results[0]?.label).toBe("Parramatta NSW, Australia");
    expect(results[0]?.metadata?.placeId).toBe("ChIJtest");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.includedRegionCodes).toEqual(["au"]);
    expect(body.regionCode).toBe("au");
    expect(body.input).toBe("parra");
  });
});
