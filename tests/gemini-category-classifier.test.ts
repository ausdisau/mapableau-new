import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/search/interpreter/load-categories", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/search/interpreter/load-categories")>();
  return {
    ...actual,
    listServiceCategories: vi.fn(async () => actual.getStaticFallbackCategories()),
  };
});

vi.mock("@/lib/config/search-interpreter", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/config/search-interpreter")>();
  return {
    ...actual,
    isSearchInterpreterConfigured: vi.fn(() => true),
    isGeminiCategoryClassifierEnabled: vi.fn(() => true),
    searchInterpreterConfig: {
      ...actual.searchInterpreterConfig,
      enabled: true,
      googleApiKey: "test-key",
      aiGatewayApiKey: "",
      modelId: "google/gemini-2.0-flash",
      geminiCategoryClassifier: true,
      classifierHubId: "",
      huggingFaceToken: "",
    },
  };
});

vi.mock("@/lib/search/interpreter/get-model", () => ({
  getInterpreterEngineId: () => "ai-sdk/google/gemini-2.0-flash",
  getInterpreterModel: () => ({ provider: "google", modelId: "gemini-2.0-flash" }),
}));

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@/lib/analytics/llm-analytics", () => ({
  captureLlmGeneration: vi.fn(),
  getLlmAnalyticsProvider: () => "google",
}));

import { generateObject } from "ai";

import {
  classifyCategorySlugHint,
  parseSlugFromClassifierOutput,
} from "@/lib/search/interpreter/classifier-hint";
import { classifyServiceCategoryWithGemini } from "@/lib/search/interpreter/gemini-category-classifier";
import {
  SEARCH_CLASSIFY_CATEGORY_OPERATIONS,
  searchClassifyCategoryJsonError,
} from "@/lib/search/search-classify-category-api-contract";

const generateObjectMock = vi.mocked(generateObject);

describe("parseSlugFromClassifierOutput", () => {
  it("parses JSON slug payload", () => {
    expect(parseSlugFromClassifierOutput('{"slug":"accessible-transport"}')).toBe(
      "accessible-transport",
    );
  });

  it("parses embedded slug JSON", () => {
    expect(
      parseSlugFromClassifierOutput('Sure: {"slug":"occupational-therapy"} done'),
    ).toBe("occupational-therapy");
  });

  it("returns null for empty or invalid text", () => {
    expect(parseSlugFromClassifierOutput("")).toBeNull();
    expect(parseSlugFromClassifierOutput("no idea")).toBeNull();
  });
});

describe("classifyServiceCategoryWithGemini", () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
  });

  it("returns validated slug from Gemini", async () => {
    generateObjectMock.mockResolvedValue({
      object: { slug: "accessible-transport", confidence: 0.91 },
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    } as never);

    const result = await classifyServiceCategoryWithGemini(
      "Wheelchair taxi near Parramatta",
    );

    expect(result.source).toBe("gemini");
    expect(result.slug).toBe("accessible-transport");
    expect(result.confidence).toBe(0.91);
    expect(result.engineId).toBe("ai-sdk/google/gemini-2.0-flash");
    expect(generateObjectMock).toHaveBeenCalledOnce();
  });

  it("rejects unknown or low-confidence slugs", async () => {
    generateObjectMock.mockResolvedValue({
      object: { slug: "not-a-real-slug", confidence: 0.99 },
      usage: {},
    } as never);

    const unknown = await classifyServiceCategoryWithGemini("something odd");
    expect(unknown.slug).toBeNull();
    expect(unknown.source).toBe("none");

    generateObjectMock.mockResolvedValue({
      object: { slug: "physiotherapy", confidence: 0.2 },
      usage: {},
    } as never);

    const low = await classifyServiceCategoryWithGemini("maybe physio?");
    expect(low.slug).toBeNull();
    expect(low.source).toBe("none");
  });

  it("returns none when generateObject throws", async () => {
    generateObjectMock.mockRejectedValue(new Error("upstream"));

    const result = await classifyServiceCategoryWithGemini("OT assessment");
    expect(result.slug).toBeNull();
    expect(result.source).toBe("none");
  });
});

describe("classifyCategorySlugHint", () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
  });

  it("prefers Gemini slug when available", async () => {
    generateObjectMock.mockResolvedValue({
      object: { slug: "support-coordination", confidence: 0.8 },
      usage: {},
    } as never);

    await expect(
      classifyCategorySlugHint("help navigating NDIS providers"),
    ).resolves.toBe("support-coordination");
  });
});

describe("search classify category API contract", () => {
  it("exposes operation id", () => {
    expect(SEARCH_CLASSIFY_CATEGORY_OPERATIONS.classifyCategory).toBe(
      "searchClassifyCategory",
    );
  });

  it("builds error responses with X-Operation-Id", async () => {
    const res = searchClassifyCategoryJsonError(
      SEARCH_CLASSIFY_CATEGORY_OPERATIONS.classifyCategory,
      503,
      {
        error: "not configured",
        code: "SEARCH_CLASSIFY_NOT_CONFIGURED",
        retryable: false,
      },
    );
    expect(res.status).toBe(503);
    expect(res.headers.get("X-Operation-Id")).toBe("searchClassifyCategory");
    const body = await res.json();
    expect(body.operationId).toBe("searchClassifyCategory");
    expect(body.code).toBe("SEARCH_CLASSIFY_NOT_CONFIGURED");
  });
});
