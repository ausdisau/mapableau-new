import { buildAiMeta } from "@/lib/coordinate/ai/escalation";

export type ExtractedGoal = {
  title: string;
  description: string;
  category: string;
  confidence: number;
  reason: string;
  sourceSpan?: string;
};

const GOAL_PATTERNS: { pattern: RegExp; category: string }[] = [
  { pattern: /community|social|participation/i, category: "Social & community participation" },
  { pattern: /daily living|personal care|home/i, category: "Core supports — Daily living" },
  { pattern: /employment|work|job/i, category: "Capacity building — Employment" },
  { pattern: /therapy|health|wellbeing/i, category: "Capacity building — Health & wellbeing" },
];

export function extractGoalsFromSummary(summary: {
  headline?: string;
  keyPoints?: string[];
}): { goals: ExtractedGoal[]; meta: ReturnType<typeof buildAiMeta> } {
  const lines = [
    summary.headline ?? "",
    ...(summary.keyPoints ?? []),
  ].filter(Boolean);

  const goals: ExtractedGoal[] = lines.slice(0, 5).map((line, index) => {
    const category =
      GOAL_PATTERNS.find((p) => p.pattern.test(line))?.category ??
      "General support";
    const confidence = line.length > 30 ? 0.74 : 0.55;
    return {
      title: line.slice(0, 80),
      description: line,
      category,
      confidence,
      reason: `Matched category "${category}" from plan language.`,
      sourceSpan: `point-${index + 1}`,
    };
  });

  const avgConfidence =
    goals.length > 0
      ? goals.reduce((sum, g) => sum + g.confidence, 0) / goals.length
      : 0.4;

  return {
    goals,
    meta: buildAiMeta({
      confidence: avgConfidence,
      reason: `Extracted ${goals.length} goal candidate(s) from plan summary.`,
    }),
  };
}
