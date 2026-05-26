import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/search/autocomplete/route";

vi.mock("@/lib/search/autocomplete-service", () => ({
  searchAutocomplete: vi.fn(async () => ({
    providers: [{ id: "p1", type: "provider", typeLabel: "Provider", label: "Demo", value: "Demo" }],
    services: [],
    locations: [],
    accessibilityFeatures: [],
    languages: [],
    popularSearches: [],
  })),
}));

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

  it("accepts postcode field used by the homepage location autocomplete", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/search/autocomplete?q=2150&context=homepage&field=postcode",
      ),
    );
    expect(res.status).toBe(200);
  });
});
