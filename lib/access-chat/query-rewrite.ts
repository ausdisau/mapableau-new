import { generateText } from "ai";

import {
  captureLlmGeneration,
  getLlmAnalyticsProvider,
} from "@/lib/analytics/llm-analytics";
import { resolveModelForTask } from "@/lib/ai/modelRouter";
import { redactPersonalInformation } from "@/lib/ai/privacy";
import type { AccessSearchIntent } from "@/types/access-chat";

/**
 * Produce short keyword query for Prisma contains filters.
 * Falls back to stripping location/feature noise deterministically.
 */
export async function rewriteQueryForSearch(
  intent: AccessSearchIntent,
): Promise<{ keywords: string; engineId: string }> {
  const routed = resolveModelForTask("query_rewrite");
  const safeQuery = redactPersonalInformation(intent.query);

  if (!routed) {
    return {
      keywords: deterministicRewrite(safeQuery, intent),
      engineId: "rules/query_rewrite",
    };
  }

  const startedAt = Date.now();
  try {
    const { text, usage } = await generateText({
      model: routed.model,
      system: `Rewrite the user accessibility place search into short English keywords for a database name/address search.
Remove suburb names, access requirements, and filler words. Return keywords only, max 8 words. No punctuation except spaces.`,
      prompt: `Query: ${safeQuery}\nSuburb: ${intent.location?.suburb ?? ""}\nCategories: ${(intent.categories ?? []).join(",")}`,
      temperature: 0.1,
    });

    captureLlmGeneration({
      traceName: "access_chat_query_rewrite",
      model: routed.engineId,
      provider: getLlmAnalyticsProvider(routed.engineId),
      latencyMs: Date.now() - startedAt,
      success: true,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      metadata: {
        task: "query_rewrite",
        fallback_used: routed.fallbackUsed,
        query_length: safeQuery.length,
      },
    });

    const keywords = text.trim().replace(/[^\w\s'-]/g, " ").slice(0, 120);
    return {
      keywords: keywords || deterministicRewrite(safeQuery, intent),
      engineId: routed.engineId,
    };
  } catch {
    captureLlmGeneration({
      traceName: "access_chat_query_rewrite",
      model: routed.engineId,
      provider: getLlmAnalyticsProvider(routed.engineId),
      latencyMs: Date.now() - startedAt,
      success: false,
      metadata: { task: "query_rewrite" },
    });
    return {
      keywords: deterministicRewrite(safeQuery, intent),
      engineId: `${routed.engineId}/fallback`,
    };
  }
}

function deterministicRewrite(
  query: string,
  intent: AccessSearchIntent,
): string {
  let q = query.toLowerCase();
  const drop = [
    "find",
    "show me",
    "near",
    "with",
    "an",
    "a",
    "the",
    "wheelchair",
    "accessible",
    "toilet",
    "parking",
    "quiet",
    "sensory",
    "step-free",
    "step free",
  ];
  if (intent.location?.suburb) {
    q = q.replace(new RegExp(intent.location.suburb, "ig"), " ");
  }
  for (const w of drop) {
    q = q.replace(new RegExp(`\\b${w}\\b`, "gi"), " ");
  }
  return q.replace(/\s+/g, " ").trim().slice(0, 120);
}
