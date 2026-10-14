import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isGeoscapePredictiveConfigured,
} from "@/lib/config/geoscape-predictive";
import {
  getAddress,
  suggestAddresses,
} from "@/lib/geoscape-predictive/address-search-service";
import { clearGeoscapePredictiveClientCache } from "@/lib/geoscape-predictive/client";
import {
  normalizeAddressResponse,
  normalizeSuggestResponse,
} from "@/lib/geoscape-predictive/normalize";
import { autocompleteQuerySchema } from "@/lib/search/autocomplete-validation";
import { geoscapeStreetAdapter } from "@/lib/search/geoscape-street-adapter";

describe("Geoscape normalize", () => {
  it("normalizes suggest list", () => {
    const result = normalizeSuggestResponse({
      suggest: [
        { id: "abc", address: "116 WARREN AV NORTH NOWRA NSW 2541", rank: 0 },
      ],
    });
    expect(result.suggest).toHaveLength(1);
    expect(result.suggest[0]?.id).toBe("abc");
  });

  it("normalizes nested data.suggest", () => {
    const result = normalizeSuggestResponse({
      data: {
        suggest: [{ id: "x", address: "1 Demo St Sydney NSW 2000" }],
      },
    });
    expect(result.suggest[0]?.address).toContain("Demo");
  });

  it("normalizes get-address feature", () => {
    const resolved = normalizeAddressResponse(
      {
        address: {
          id: "suggest-1",
          geometry: { type: "Point", coordinates: [150.58, -34.85] },
          properties: {
            formatted_address: "116 WARREN AVENUE, NORTH NOWRA NSW 2541",
            locality_name: "NORTH NOWRA",
            state_territory: "NSW",
            postcode: "2541",
            address_identifier: "GANSW705536561",
          },
        },
      },
      "suggest-1",
    );
    expect(resolved).toMatchObject({
      formattedAddress: "116 WARREN AVENUE, NORTH NOWRA NSW 2541",
      suburb: "NORTH NOWRA",
      state: "NSW",
      postcode: "2541",
      gnafId: "GANSW705536561",
      lat: -34.85,
      lng: 150.58,
    });
  });
});

describe("Geoscape Predictive client", () => {
  beforeEach(() => {
    vi.stubEnv("GEOSCAPE_API_KEY", "test-geoscape-key-xxxxxxxxxxxxxxxx");
    vi.stubEnv("GEOSCAPE_PREDICTIVE_ENABLED", "true");
    clearGeoscapePredictiveClientCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearGeoscapePredictiveClientCache();
  });

  it("defaults to disabled when GEOSCAPE_PREDICTIVE_ENABLED is not true", async () => {
    vi.stubEnv("GEOSCAPE_PREDICTIVE_ENABLED", "");
    expect(isGeoscapePredictiveConfigured()).toBe(false);
    await expect(suggestAddresses({ q: "116 Warren" })).rejects.toMatchObject({
      code: "GEOSCAPE_NOT_CONFIGURED",
    });
  });

  it("throws when API key is missing", async () => {
    vi.stubEnv("GEOSCAPE_API_KEY", "");
    await expect(suggestAddresses({ q: "116 Warren" })).rejects.toMatchObject({
      code: "GEOSCAPE_NOT_CONFIGURED",
    });
  });

  it("calls suggest with Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          suggest: [
            {
              id: "suggest-1",
              address: "116 WARREN AV NORTH NOWRA NSW 2541",
              rank: 0,
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await suggestAddresses({ q: "116 Warren", limit: 5 });
    expect(result.suggest).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalled();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/predictive/address");
    expect(url).toContain("query=116");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "test-geoscape-key-xxxxxxxxxxxxxxxx",
    );
  });

  it("resolves address by id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          address: {
            id: "suggest-1",
            geometry: { type: "Point", coordinates: [151.2, -33.8] },
            properties: {
              formatted_address: "1 DEMO STREET, SYDNEY NSW 2000",
              locality_name: "SYDNEY",
              state_territory: "NSW",
              postcode: "2000",
              address_identifier: "GANSW123",
            },
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const address = await getAddress("suggest-1");
    expect(address.formattedAddress).toContain("DEMO");
    expect(address.suburb).toBe("SYDNEY");
    expect(address.lat).toBe(-33.8);
  });

  it("maps street adapter suggestions", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          suggest: [
            {
              id: "s1",
              address: "116 WARREN AV NORTH NOWRA NSW 2541",
              rank: 0,
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const suggestions = await geoscapeStreetAdapter.search("116 Warren", 5);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.typeLabel).toBe("Address");
    expect(suggestions[0]?.metadata?.gnafId).toBe("s1");
    expect(suggestions[0]?.metadata?.postcode).toBe("2541");
  });

  it("returns empty adapter results when query is short", async () => {
    const suggestions = await geoscapeStreetAdapter.search("12", 5);
    expect(suggestions).toEqual([]);
  });
});

describe("autocomplete validation booking contexts", () => {
  it("accepts booking contexts", () => {
    for (const context of ["booking", "transport_request", "care_request"] as const) {
      const parsed = autocompleteQuerySchema.safeParse({
        q: "116",
        context,
        field: "location",
        mode: "reactive",
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("still accepts homepage and provider_finder", () => {
    expect(
      autocompleteQuerySchema.safeParse({
        q: "St",
        context: "homepage",
        field: "location",
      }).success,
    ).toBe(true);
    expect(
      autocompleteQuerySchema.safeParse({
        q: "St",
        context: "provider_finder",
        field: "location",
      }).success,
    ).toBe(true);
  });
});
