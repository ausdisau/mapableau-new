import { buildAiMeta } from "@/lib/coordinate/ai/escalation";
import type { CoordinatePlanSummary } from "@/lib/coordinate/types";

export function summarisePlanFromText(planText: string): {
  summary: CoordinatePlanSummary;
  meta: ReturnType<typeof buildAiMeta>;
} {
  const trimmed = planText.trim();
  const sentences = trimmed
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const headline =
    sentences[0]?.slice(0, 120) ||
    "NDIS plan summary pending your review";

  const keyPoints = sentences.slice(1, 5).map((s) => s.slice(0, 160));
  if (keyPoints.length === 0 && trimmed.length > 0) {
    keyPoints.push("Review uploaded plan details with your coordinator.");
  }

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const confidence = wordCount > 40 ? 0.72 : wordCount > 10 ? 0.58 : 0.45;

  return {
    summary: {
      headline,
      keyPoints,
      reviewNotes:
        confidence < 0.65
          ? "Low confidence extraction — a human should confirm goals and budget categories."
          : undefined,
    },
    meta: buildAiMeta({
      confidence,
      reason: `Rule-based summary from ${wordCount} words of plan text.`,
    }),
  };
}
