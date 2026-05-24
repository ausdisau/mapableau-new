import { describe, expect, it } from "vitest";

import {
  getStaticPredictiveSuggestions,
} from "@/lib/search/static-predictive-suggestions";

describe("getStaticPredictiveSuggestions", () => {
  it("returns popular searches on empty query for homepage", () => {
    const result = getStaticPredictiveSuggestions({
      context: "homepage",
      field: "all",
      query: "",
    });
    expect(result.popularSearches.length).toBeGreaterThan(0);
    expect(result.popularSearches[0]?.type).toBe("popular_search");
  });

  it("returns service matches for typed query", () => {
    const result = getStaticPredictiveSuggestions({
      context: "provider_finder",
      field: "service",
      query: "physio",
    });
    expect(result.services.some((s) => /physio/i.test(s.label))).toBe(true);
  });

  it("returns location matches for location field", () => {
    const result = getStaticPredictiveSuggestions({
      context: "homepage",
      field: "location",
      query: "parra",
    });
    expect(result.locations.some((s) => /parramatta/i.test(s.label))).toBe(true);
  });

  it("returns empty groups for single-character query", () => {
    const result = getStaticPredictiveSuggestions({
      context: "homepage",
      field: "all",
      query: "p",
    });
    expect(result.services).toEqual([]);
    expect(result.popularSearches).toEqual([]);
  });
});
