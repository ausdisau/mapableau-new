import { generateObject } from "ai";
import { z } from "zod";

import {
  captureLlmGeneration,
  getLlmAnalyticsProvider,
} from "@/lib/analytics/llm-analytics";
import {
  isCategoryClassifierEnabled,
  searchInterpreterConfig,
} from "@/lib/config/search-interpreter";

import { getInterpreterEngineId, getInterpreterModel } from "./get-model";
import { listServiceCategories } from "./load-categories";

export type GeminiCategoryClassification = {
  slug: string | null;
  confidence: number;
  engineId: string;
  /** `"llm"` when a catalog-validated slug is returned; provider is in `engineId`. */
  source: "llm" | "none";
};

const classificationSchema = z.object({
  slug: z
    .string()
    .nullable()
    .describe(
      "Canonical service category slug from the catalog, or null when unsure",
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Model confidence that the slug matches the query"),
});

const MIN_ACCEPT_CONFIDENCE = 0.45;

/**
 * Dedicated LLM step that maps free-text search to a canonical
 * `service_categories` slug (Google Gemini or OpenAI). Never throws —
 * returns null slug on any failure.
 */
export async function classifyServiceCategoryWithGemini(
  query: string,
): Promise<GeminiCategoryClassification> {
  const trimmed = query.trim();
  const engineId = getInterpreterEngineId();

  if (!trimmed || !isCategoryClassifierEnabled()) {
    return { slug: null, confidence: 0, engineId: "rules/disabled", source: "none" };
  }

  const categories = await listServiceCategories();
  if (categories.length === 0) {
    return { slug: null, confidence: 0, engineId, source: "none" };
  }

  const catalogLines = categories
    .map(
      (c) =>
        `- ${c.slug}: ${c.name}${
          c.keywords.length ? ` (keywords: ${c.keywords.join(", ")})` : ""
        }`,
    )
    .join("\n");

  const system = `You classify Australian NDIS disability support search queries into exactly one MapAble service category slug.

Return JSON only:
- slug: one canonical slug from the catalog below, or null if none fit
- confidence: 0–1 how sure you are

Catalog:
${catalogLines}

Rules:
- Prefer Australian English and NDIS terminology (e.g. OT → occupational-therapy, wheelchair taxi → accessible-transport)
- Do not invent slugs outside the catalog
- If the query is only a location or access need with no service, return slug null
- If multiple categories could apply, pick the strongest primary service`;

  const startedAt = Date.now();

  try {
    const { object, usage } = await generateObject({
      model: getInterpreterModel(),
      schema: classificationSchema,
      system,
      prompt: `Classify this search query: ${trimmed}`,
      temperature: 0.1,
    });

    captureLlmGeneration({
      traceName: "service_category_classifier",
      model: searchInterpreterConfig.modelId,
      provider: getLlmAnalyticsProvider(engineId),
      latencyMs: Date.now() - startedAt,
      success: true,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      metadata: {
        query_length: trimmed.length,
        engine_id: engineId,
      },
    });

    const rawSlug = object.slug?.trim() || null;
    const matched = rawSlug
      ? categories.find((c) => c.slug === rawSlug)
      : undefined;

    if (!matched || object.confidence < MIN_ACCEPT_CONFIDENCE) {
      return {
        slug: null,
        confidence: object.confidence,
        engineId,
        source: "none",
      };
    }

    return {
      slug: matched.slug,
      confidence: object.confidence,
      engineId,
      source: "llm",
    };
  } catch (err) {
    captureLlmGeneration({
      traceName: "service_category_classifier",
      model: searchInterpreterConfig.modelId,
      provider: getLlmAnalyticsProvider(engineId),
      latencyMs: Date.now() - startedAt,
      success: false,
      errorName: err instanceof Error ? err.name : "UnknownError",
      metadata: {
        query_length: trimmed.length,
        engine_id: engineId,
      },
    });
    console.error("[search-interpreter] Gemini category classifier failed", err);
    return { slug: null, confidence: 0, engineId, source: "none" };
  }
}
