import { describe, expect, it } from "vitest";

import {
  combineSearchHits,
  importedProviderHits,
  navigationSearch,
  searchTokens,
} from "@/lib/search/mapable-search-core";

describe("MapAble Search public discovery", () => {
  it("finds multiple MapAble verticals for a general query", () => {
    const hits = navigationSearch({ q: "support", vertical: "all" });
    expect(hits.some((x) => x.vertical === "providers")).toBe(true);
    expect(hits.some((x) => x.vertical === "care")).toBe(true);
  });

  it("restricts results to the selected vertical", () => {
    const hits = navigationSearch({ q: "", vertical: "jobs" });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.href).toBe("/employment");
  });

  it("includes places navigation for the places vertical", () => {
    const hits = navigationSearch({ q: "", vertical: "places" });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.href).toBe("/accessibility-map");
    expect(hits[0]?.vertical).toBe("places");
  });

  it("does not create clearance or registration assertions from imported rows", () => {
    const hits = importedProviderHits([{
      source_id: "synthetic-outlet-01",
      provider_name: "Synthetic Test Provider",
      suburb: "Sydney",
      state: "NSW",
      postcode: "2000",
      services: ["Daily personal activities"],
      updated_at: "2026-11-01T00:00:00Z",
    }]);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.registration).toBe("not_independently_verified");
    expect(hits[0]?.workerScreening).toBe("not_independently_verified");
    expect(hits[0]?.accessFit).toBe("unknown");
    expect(hits[0]?.availability).toBe("unknown");
    expect(hits[0]?.provenance).toBe("local_ndis_directory_import");
  });

  it("discards demos, incomplete records and exact duplicate outlet identities", () => {
    const hits = importedProviderHits([
      { source_id: "one", provider_name: "Synthetic", suburb: null, state: null, postcode: null },
      { source_id: "one", provider_name: "Duplicate", suburb: null, state: null, postcode: null },
      { source_id: "demo", provider_name: "Not Real", is_demo: true, suburb: null, state: null, postcode: null },
      { source_id: "", provider_name: "Incomplete", suburb: null, state: null, postcode: null },
    ]);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.title).toBe("Synthetic");
  });

  it("deduplicates combined results without overriding provenance", () => {
    const modules = navigationSearch({ q: "", vertical: "providers" });
    const combined = combineSearchHits(modules, modules);
    expect(combined).toHaveLength(1);
    expect(combined[0]?.provenance).toBe("mapable_navigation");
  });

  it("bounds query tokenisation", () => {
    expect(searchTokens("A " + "wheelchair ".repeat(40))).toHaveLength(24);
  });

  it("encodes imported provider names for safe internal search links", () => {
    const hits = importedProviderHits([
      { source_id: "test", provider_name: "A&B Support", suburb: null, state: null, postcode: null },
    ]);
    expect(hits[0]?.href).toBe("/provider-finder?q=A%26B%20Support");
  });
});
