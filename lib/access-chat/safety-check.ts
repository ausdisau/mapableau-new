import { generateText } from "ai";

import { resolveModelForTask } from "@/lib/ai/modelRouter";
import {
  captureLlmGeneration,
  getLlmAnalyticsProvider,
} from "@/lib/analytics/llm-analytics";
import type { AccessSearchResult } from "@/types/access-chat";

const LEGAL_CLAIMS =
  /\b(dda|disability discrimination act|building code|legally compliant|fully compliant|certified compliant|ncc\b|premises standards)\b/i;

/**
 * Second-pass safety/quality check for uncertain answers.
 * Strips legal-compliance claims; runs Gemini when confidence is low.
 */
export async function runSafetyReview(
  replyText: string,
  results: AccessSearchResult[],
): Promise<{ text: string; reviewed: boolean; engineId: string }> {
  let text = replyText.replace(LEGAL_CLAIMS, "observed access conditions");

  const uncertain =
    results.length === 0 ||
    results.some(
      (r) =>
        r.fit.label === "not_enough_information" ||
        r.fit.confidence < 0.45 ||
        r.fit.label === "likely_unsuitable",
    );

  if (!uncertain && !LEGAL_CLAIMS.test(replyText)) {
    return { text, reviewed: false, engineId: "rules/safety_skip" };
  }

  const routed = resolveModelForTask("safety_review");
  if (!routed) {
    return {
      text: appendUncertaintyNote(text),
      reviewed: false,
      engineId: "rules/safety",
    };
  }

  const startedAt = Date.now();
  try {
    const { text: revised, usage } = await generateText({
      model: routed.model,
      system: `You review MapAble Access assistant replies for safety and accuracy.
Remove any legal compliance claims (DDA, building code, certified accessible).
Keep only observed community / MapAble-verified access conditions.
If information is thin, say so plainly. Do not invent places or features.
Return the revised reply only.`,
      prompt: text,
      temperature: 0.1,
    });

    captureLlmGeneration({
      traceName: "access_chat_safety_review",
      model: routed.engineId,
      provider: getLlmAnalyticsProvider(routed.engineId),
      latencyMs: Date.now() - startedAt,
      success: true,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      metadata: { task: "safety_review", fallback_used: routed.fallbackUsed },
    });

    return {
      text: revised.trim() || appendUncertaintyNote(text),
      reviewed: true,
      engineId: routed.engineId,
    };
  } catch {
    captureLlmGeneration({
      traceName: "access_chat_safety_review",
      model: routed.engineId,
      provider: getLlmAnalyticsProvider(routed.engineId),
      latencyMs: Date.now() - startedAt,
      success: false,
      metadata: { task: "safety_review" },
    });
    return {
      text: appendUncertaintyNote(text),
      reviewed: false,
      engineId: `${routed.engineId}/fallback`,
    };
  }
}

function appendUncertaintyNote(text: string): string {
  if (/not enough information|may have changed/i.test(text)) return text;
  return `${text}\n\nAccess conditions can change. Check recent reports and use your judgement before visiting.`;
}
