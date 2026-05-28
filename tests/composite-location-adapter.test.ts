import { beforeEach, describe, expect, it, vi } from "vitest";

import { compositeLocationAdapter } from "@/lib/search/composite-location-adapter";
import { googleLocationAdapter } from "@/lib/search/google-location-adapter";
import { localLocationAdapter } from "@/lib/search/local-location-adapter";

vi.mock("@/lib/search/local-location-adapter", () => ({
  localLocationAdapter: {
    search: vi.fn(),
  },
}));

vi.mock("@/lib/search/google-location-adapter", () => ({
  googleLocationAdapter: {
    search: vi.fn(),
  },
}));

vi.mock("@/lib/geocoding/google-config", () => ({
  isGoogleMapsConfigured: vi.fn(() => true),
}));

describe("compositeLocationAdapter", () => {
  beforeEach(() => {
    vi.mocked(localLocationAdapter.search).mockReset();
    vi.mocked(googleLocationAdapter.search).mockReset();
  });

  it("returns only local results when limit is filled", async () => {
    vi.mocked(localLocationAdapter.search).mockResolvedValue([
      {
        id: "loc-1",
        type: "location",
        typeLabel: "Location",
        label: "Parramatta NSW",
        value: "Parramatta NSW",
      },
    ]);

    const results = await compositeLocationAdapter.search("parra", 1);
    expect(results).toHaveLength(1);
    expect(googleLocationAdapter.search).not.toHaveBeenCalled();
  });

  it("merges Google suggestions and dedupes by label", async () => {
    vi.mocked(localLocationAdapter.search).mockResolvedValue([
      {
        id: "loc-1",
        type: "location",
        typeLabel: "Location",
        label: "Parramatta NSW",
        value: "Parramatta NSW",
      },
    ]);
    vi.mocked(googleLocationAdapter.search).mockResolvedValue([
      {
        id: "google-1",
        type: "location",
        typeLabel: "Location",
        label: "parramatta nsw",
        value: "parramatta nsw",
      },
      {
        id: "google-2",
        type: "location",
        typeLabel: "Location",
        label: "Penrith NSW",
        value: "Penrith NSW",
      },
    ]);

    const results = await compositeLocationAdapter.search("parra", 3);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.label)).toEqual(["Parramatta NSW", "Penrith NSW"]);
    expect(googleLocationAdapter.search).toHaveBeenCalledWith("parra", 2);
  });
});
