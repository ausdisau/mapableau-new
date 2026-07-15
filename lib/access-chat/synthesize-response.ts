import { generateText } from "ai";

import { resolveModelForTask } from "@/lib/ai/modelRouter";
import { redactPersonalInformation } from "@/lib/ai/privacy";
import {
  captureLlmGeneration,
  getLlmAnalyticsProvider,
} from "@/lib/analytics/llm-analytics";
import { ACCESS_DISCLAIMER } from "@/lib/access-map/copy";
import type {
  AccessSearchIntent,
  AccessSearchResult,
} from "@/types/access-chat";

export type SynthesisOutcome = {
  replyText: string;
  engineId: string;
  usedModel: boolean;
};

const FIT_LABEL_PLAIN: Record<AccessSearchResult["fit"]["label"], string> = {
  likely_suitable: "likely suitable",
  suitable_with_caution: "suitable with caution",
  not_enough_information: "not enough information yet",
  likely_unsuitable: "likely unsuitable based on current reports",
};

/**
 * Evidence-grounded answer. Never invent features; cite fit labels and dates only.
 */
export async function synthesizeAccessChatReply(
  intent: AccessSearchIntent,
  results: AccessSearchResult[],
): Promise<SynthesisOutcome> {
  const grounded = buildDeterministicReply(intent, results);
  const routed = resolveModelForTask("result_synthesis");

  if (!routed || results.length === 0) {
    return {
      replyText: grounded,
      engineId: results.length ? "rules/synthesis" : "rules/empty",
      usedModel: false,
    };
  }

  const evidenceBlock = results
    .map(
      (r, i) =>
        `${i + 1}. ${r.name} (${r.category}) — fit: ${r.fit.label}, confidence: ${r.fit.confidence}. Reasons: ${r.fit.reasons.join("; ") || "none"}. Cautions: ${r.fit.cautions.join("; ") || "none"}. Last verified: ${r.accessSummary.lastVerifiedAt ?? "unknown"}. Alerts: ${(r.evidence.activeAlerts ?? []).join("; ") || "none"}.`,
    )
    .join("\n");

  const startedAt = Date.now();
  try {
    const { text, usage } = await generateText({
      model: routed.model,
      system: `You are MapAble Access assistant. Write plain-language Australian English.
Rules:
- Only use facts from the evidence block. Do not invent access features.
- List 3–5 places when available. Include fit label and confidence for each.
- Mention last verification when present. Surface active alerts.
- Never say a venue is legally compliant or DDA-compliant.
- Offer actions: open marker, plan accessible transport, add access report, refine search.
- Keep under 280 words.`,
      prompt: `User asked (redacted): ${redactPersonalInformation(intent.query)}\n\nEvidence:\n${evidenceBlock}\n\nDraft a helpful reply.`,
      temperature: 0.3,
    });

    captureLlmGeneration({
      traceName: "access_chat_synthesis",
      model: routed.engineId,
      provider: getLlmAnalyticsProvider(routed.engineId),
      latencyMs: Date.now() - startedAt,
      success: true,
      inputTokens: usage?.inputTokens,
      outputTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
      metadata: {
        task: "result_synthesis",
        fallback_used: routed.fallbackUsed,
        result_count: results.length,
      },
    });

    const cleaned = text.trim();
    return {
      replyText: cleaned || grounded,
      engineId: routed.engineId,
      usedModel: Boolean(cleaned),
    };
  } catch {
    captureLlmGeneration({
      traceName: "access_chat_synthesis",
      model: routed.engineId,
      provider: getLlmAnalyticsProvider(routed.engineId),
      latencyMs: Date.now() - startedAt,
      success: false,
      metadata: { task: "result_synthesis" },
    });

    // Gemini fallback_answer when OpenAI synthesis fails
    const fallback = resolveModelForTask("fallback_answer");
    if (fallback) {
      try {
        const { text } = await generateText({
          model: fallback.model,
          prompt: `Rewrite this access search summary clearly without inventing facts:\n${grounded}`,
          temperature: 0.2,
        });
        return {
          replyText: text.trim() || grounded,
          engineId: fallback.engineId,
          usedModel: true,
        };
      } catch {
        /* use deterministic */
      }
    }

    return {
      replyText: grounded,
      engineId: `${routed.engineId}/fallback`,
      usedModel: false,
    };
  }
}

export function buildDeterministicReply(
  intent: AccessSearchIntent,
  results: AccessSearchResult[],
): string {
  if (!results.length) {
    return [
      "I could not find enough matching places for that access search.",
      intent.location?.suburb
        ? `Try widening the area around ${intent.location.suburb}, or remove some required features.`
        : "Try adding a suburb, or fewer required access features.",
      "You can refine your search, or add an access report if you know a place that should be listed.",
      ACCESS_DISCLAIMER,
    ].join(" ");
  }

  const lines = results.map((r) => {
    const verified = r.accessSummary.lastVerifiedAt
      ? ` Last confirmed ${formatRelative(r.accessSummary.lastVerifiedAt)}.`
      : "";
    const caution =
      r.fit.cautions.length > 0
        ? ` Caution: ${r.fit.cautions[0]}`
        : "";
    const alert =
      r.evidence.activeAlerts?.length
        ? ` Active alert: ${r.evidence.activeAlerts[0]}.`
        : "";
    const reason = r.fit.reasons[0] ? ` ${r.fit.reasons[0]}` : "";
    return `• ${r.name} is ${FIT_LABEL_PLAIN[r.fit.label]} (confidence ${Math.round(r.fit.confidence * 100)}%).${reason}${verified}${caution}${alert}`;
  });

  return [
    `Here are ${results.length} places based on community-reported and MapAble-verified access information:`,
    ...lines,
    "Next: open a marker on the map, plan accessible transport, add an access report, save a place, or refine your search.",
    "These are observed access conditions, not legal compliance assessments.",
  ].join("\n");
}

function formatRelative(iso: string): string {
  const days = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 31) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} month(s) ago`;
  return `${Math.round(days / 365)} year(s) ago`;
}
