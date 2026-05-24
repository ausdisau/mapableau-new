import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  buildProviderFinderUrl,
  mergeWithExistingValues,
  resolveSearchValues,
} from "@/lib/search/natural-language-client";

const looksLikeNaturalLanguage = vi.fn();
const parseNaturalLanguageQuerySafe = vi.fn();

vi.mock("@/lib/search/gemini-nl-parser", () => ({
  looksLikeNaturalLanguage: (...args: unknown[]) =>
    looksLikeNaturalLanguage(...args),
  parseNaturalLanguageQuerySafe: (...args: unknown[]) =>
    parseNaturalLanguageQuerySafe(...args),
}));

vi.mock("@/lib/search/nl-search-config", () => ({
  isNlSearchConfigured: vi.fn(() => true),
  nlSearchConfig: {
    enabled: true,
    geminiApiKey: "test-key",
    geminiModel: "gemini-flash-latest",
    geminiBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
}));

describe("looksLikeNaturalLanguage (via gemini-nl-parser)", () => {
  it("is re-exported for route tests", async () => {
    const mod = await import("@/lib/search/gemini-nl-parser");
    expect(typeof mod.looksLikeNaturalLanguage).toBe("function");
  });
});

describe("buildProviderFinderUrl", () => {
  it("builds query string from structured values", () => {
    const url = buildProviderFinderUrl({
      query: "support worker",
      location: "St Ives",
      accessQuery: "wheelchair access",
      serviceQuery: "",
      providerName: "",
    });
    expect(url).toContain("q=support+worker");
    expect(url).toContain("location=St+Ives");
    expect(url).toContain("access=wheelchair+access");
  });
});

describe("mergeWithExistingValues", () => {
  it("prefers parsed values but keeps existing when parsed is empty", () => {
    const merged = mergeWithExistingValues(
      { q: "transport", location: "Parramatta", access: "", service: "", provider: "" },
      {
        query: "old",
        location: "",
        accessQuery: "Auslan",
        serviceQuery: "therapy",
        providerName: "",
      },
    );
    expect(merged.query).toBe("transport");
    expect(merged.location).toBe("Parramatta");
    expect(merged.accessQuery).toBe("Auslan");
    expect(merged.serviceQuery).toBe("therapy");
  });
});

describe("resolveSearchValues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns values unchanged when other fields are set", async () => {
    const values = {
      query: "support worker near St Ives",
      location: "Manual",
      accessQuery: "",
      serviceQuery: "",
      providerName: "",
    };
    const result = await resolveSearchValues(values);
    expect(result).toEqual(values);
  });

  it("parses natural language when only primary query is set", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          parsed: true,
          filters: {
            q: "support worker",
            location: "St Ives",
            access: "",
            service: "",
            provider: "",
          },
        }),
      })) as unknown as typeof fetch,
    );

    const result = await resolveSearchValues({
      query: "Support worker near St Ives",
      location: "",
      accessQuery: "",
      serviceQuery: "",
      providerName: "",
    });

    expect(result.query).toBe("support worker");
    expect(result.location).toBe("St Ives");
  });
});

describe("POST /api/search/natural-language", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    looksLikeNaturalLanguage.mockImplementation((query: string) => {
      const q = query.trim();
      return q.split(/\s+/).length >= 3;
    });
  });

  it("rejects empty query", async () => {
    const { POST } = await import("@/app/api/search/natural-language/route");
    const res = await POST(
      new Request("http://localhost/api/search/natural-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "a" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns parsed filters for natural language query", async () => {
    parseNaturalLanguageQuerySafe.mockResolvedValueOnce({
      parsed: true,
      filters: {
        q: "support worker",
        location: "St Ives",
        access: "wheelchair access",
        service: "",
        provider: "",
      },
    });

    const { POST } = await import("@/app/api/search/natural-language/route");
    const res = await POST(
      new Request("http://localhost/api/search/natural-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Support worker near St Ives with wheelchair access",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.parsed).toBe(true);
    expect(body.filters.location).toBe("St Ives");
    expect(body.filters.access).toBe("wheelchair access");
    expect(parseNaturalLanguageQuerySafe).toHaveBeenCalledOnce();
  });

  it("passes through simple queries without calling Gemini", async () => {
    const { POST } = await import("@/app/api/search/natural-language/route");
    const res = await POST(
      new Request("http://localhost/api/search/natural-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "hello" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.parsed).toBe(false);
    expect(body.filters.q).toBe("hello");
    expect(parseNaturalLanguageQuerySafe).not.toHaveBeenCalled();
  });
});
