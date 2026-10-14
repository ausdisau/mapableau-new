import { describe, expect, it, vi, beforeEach } from "vitest";

import { searchLocations } from "@/lib/search/location-autocomplete-adapter";
import { searchPredictiveSuggestions } from "@/lib/search/predictive-suggestion-engine";
import type { AutocompleteSuggestion } from "@/types/search";

vi.mock("@/lib/search/service-autocomplete", () => ({
  listProactiveCatalog: vi.fn(async () => ({
    suggestions: [
      {
        id: "popular-1",
        type: "popular_search",
        typeLabel: "Popular",
        label: "Personal care",
        value: "Personal care",
      },
    ],
    popularWeights: [["personal care", 10]],
    failed: false,
    usedFallback: false,
  })),
  listProactiveAccessibility: vi.fn(),
  listProactiveLanguages: vi.fn(),
  searchAccessibilityFeatures: vi.fn(async () => []),
  searchLanguages: vi.fn(async () => []),
  searchPopularSearches: vi.fn(async () => []),
  searchServiceCategories: vi.fn(async () => []),
}));

vi.mock("@/lib/search/provider-autocomplete", () => ({
  searchProviders: vi.fn(async () => []),
  listProactiveProviders: vi.fn(),
}));

vi.mock("@/lib/search/location-autocomplete-adapter", () => ({
  searchLocations: vi.fn(async () => []),
}));

vi.mock("@/lib/search/local-location-adapter", () => ({
  listProactiveLocations: vi.fn(),
}));

const searchLocationsMock = vi.mocked(searchLocations);

describe("searchPredictiveSuggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchLocationsMock.mockResolvedValue([]);
  });

  it("returns proactive catalog without query", async () => {
    const result = await searchPredictiveSuggestions({
      mode: "proactive",
      query: "",
      context: "homepage",
      field: "all",
    });

    expect(result.meta.mode).toBe("proactive");
    expect(result.groups.popularSearches.length + result.groups.services.length).toBeGreaterThan(0);
  });

  it("returns empty groups for short reactive query", async () => {
    const result = await searchPredictiveSuggestions({
      mode: "reactive",
      query: "a",
      context: "homepage",
    });

    expect(result.groups.providers).toEqual([]);
    expect(result.meta.mode).toBe("reactive");
  });

  it("routes booking location search to street adapter context", async () => {
    const streetHit: AutocompleteSuggestion = {
      id: "geoscape-1",
      type: "location",
      typeLabel: "Address",
      label: "1 Demo St Sydney NSW 2000",
      value: "1 Demo St Sydney NSW 2000",
      metadata: {
        gnafId: "s1",
        suburb: "Sydney",
        state: "NSW",
        postcode: "2000",
      },
    };
    searchLocationsMock.mockResolvedValue([streetHit]);

    const result = await searchPredictiveSuggestions({
      mode: "reactive",
      query: "1 Demo",
      context: "booking",
      field: "location",
    });

    expect(searchLocationsMock).toHaveBeenCalledWith(
      "1 Demo",
      expect.any(Number),
      "booking",
    );
    expect(result.groups.locations).toHaveLength(1);
    expect(result.groups.providers).toEqual([]);
  });

  it("returns empty proactive groups for booking street context", async () => {
    const result = await searchPredictiveSuggestions({
      mode: "proactive",
      query: "",
      context: "transport_request",
      field: "location",
    });

    expect(result.groups.locations).toEqual([]);
    expect(searchLocationsMock).not.toHaveBeenCalled();
  });

  it("keeps provider_finder location on suburb composite (no booking flag)", async () => {
    const suburbHit: AutocompleteSuggestion = {
      id: "suburb-1",
      type: "location",
      typeLabel: "Location",
      label: "Footscray VIC",
      value: "Footscray VIC",
    };
    searchLocationsMock.mockResolvedValue([suburbHit]);

    await searchPredictiveSuggestions({
      mode: "reactive",
      query: "Foot",
      context: "provider_finder",
      field: "location",
    });

    expect(searchLocationsMock).toHaveBeenCalledWith(
      "Foot",
      expect.any(Number),
      "provider_finder",
    );
  });
});

