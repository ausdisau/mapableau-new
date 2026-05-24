import { describe, expect, it } from "vitest";

import {
  buildLiveRegionMessage,
  searchAutocomplete,
} from "@/lib/search/autocomplete-service";

describe("searchAutocomplete", () => {
  it("returns empty groups for short query", async () => {
    const result = await searchAutocomplete({
      query: "a",
      context: "homepage",
    });
    expect(result.providers).toEqual([]);
    expect(result.services).toEqual([]);
  });
});

describe("buildLiveRegionMessage", () => {
  it("describes loading state", () => {
    expect(buildLiveRegionMessage(true, 0, "phys")).toBe("Loading suggestions.");
  });

  it("describes no results", () => {
    expect(buildLiveRegionMessage(false, 0, "physio")).toBe(
      "No suggestions found for physio.",
    );
  });

  it("describes suggestion count", () => {
    expect(buildLiveRegionMessage(false, 3, "para")).toBe(
      "3 suggestions available.",
    );
  });
});
