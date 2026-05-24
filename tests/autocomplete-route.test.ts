import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/search/autocomplete/route";
import { searchAutocomplete } from "@/lib/search/autocomplete-service";

vi.mock("@/lib/search/autocomplete-service", () => ({
  searchAutocomplete: vi.fn(async (input: { predictive?: boolean }) => ({
    providers: [{ id: "p1", type: "provider", typeLabel: "Provider", label: "Demo", value: "Demo" }],
    services: [],
    locations: [],
    accessibilityFeatures: [],
    languages: [],
    popularSearches: input.predictive
      ? [
          {
            id: "pop1",
            type: "popular_search",
            typeLabel: "Popular",
            label: "Support worker near St Ives",
            value: "Support worker near St Ives",
          },
        ]
      : [],
  })),
}));

vi.mock("@/lib/search/outlet-autocomplete-index", () => ({
  warmOutletAutocompleteIndex: vi.fn(),
}));

const mockedSearch = vi.mocked(searchAutocomplete);

describe("GET /api/search/autocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects query shorter than 2 characters", async () => {
    const res = await GET(
      new Request("http://localhost/api/search/autocomplete?q=a&context=homepage"),
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid context", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/search/autocomplete?q=physio&context=invalid",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("returns grouped suggestions for valid query", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/search/autocomplete?q=physio&context=provider_finder",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups.providers).toHaveLength(1);
  });

  it("returns predictive suggestions for empty query", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/search/autocomplete?q=&context=homepage&predictive=true",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups.popularSearches.length).toBeGreaterThan(0);
    expect(mockedSearch).toHaveBeenCalledWith(
      expect.objectContaining({ predictive: true, query: "" }),
    );
  });

  it("rejects empty query without predictive flag", async () => {
    const res = await GET(
      new Request("http://localhost/api/search/autocomplete?q=&context=homepage"),
    );
    expect(res.status).toBe(400);
  });
});
