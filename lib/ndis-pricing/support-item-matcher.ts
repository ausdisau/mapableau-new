import { prisma } from "@/lib/prisma";
import type { SupportItemMatch, PricingWarning } from "@/types/ndis-pricing";
import type { matchSupportItemSchema } from "@/types/ndis-pricing";
import type { z } from "zod";

export type MatchInput = z.infer<typeof matchSupportItemSchema>;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function scoreItem(
  item: {
    code: string;
    name: string;
    categoryLabel: string | null;
    registrationGroup: string | null;
    serviceTypes: string[];
    providerTypes: string[];
    matchContextJson: unknown;
    active: boolean;
  },
  input: MatchInput
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (!item.active) return { score: 0, reasons: ["Item inactive in catalogue"] };

  if (input.serviceType && item.serviceTypes.includes(input.serviceType)) {
    score += 40;
    reasons.push(`Service type matches: ${input.serviceType}`);
  } else if (input.serviceType && item.serviceTypes.length === 0) {
    score += 5;
    reasons.push("Service type not tagged on item — uncertain match");
  }

  if (input.providerType && item.providerTypes.includes(input.providerType)) {
    score += 25;
    reasons.push(`Provider type matches: ${input.providerType}`);
  }

  if (
    input.registrationGroup &&
    item.registrationGroup?.toLowerCase() === input.registrationGroup.toLowerCase()
  ) {
    score += 20;
    reasons.push("Registration group matches");
  }

  if (input.description) {
    const tokens = tokenize(input.description);
    const nameTokens = tokenize(item.name);
    const overlap = tokens.filter((t) => nameTokens.includes(t)).length;
    if (overlap > 0) {
      score += Math.min(30, overlap * 8);
      reasons.push(`Description overlap (${overlap} terms)`);
    }
  }

  const ctx = item.matchContextJson as Record<string, string> | null;
  if (input.context && ctx) {
    for (const [k, v] of Object.entries(input.context)) {
      if (ctx[k] && String(ctx[k]).toLowerCase() === String(v).toLowerCase()) {
        score += 10;
        reasons.push(`Context ${k} matches`);
      }
    }
  }

  if (reasons.length === 0) reasons.push("Weak catalogue signal — human review recommended");

  return { score, reasons };
}

function confidenceFromScore(score: number): SupportItemMatch["confidence"] {
  if (score >= 55) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export async function matchSupportItems(
  input: MatchInput
): Promise<{ matches: SupportItemMatch[]; disclaimer: string }> {
  const candidates = await prisma.ndisSupportItem.findMany({
    where: { active: true },
    take: 500,
    orderBy: { code: "asc" },
  });

  const scored = candidates
    .map((item) => {
      const { score, reasons } = scoreItem(item, input);
      const warnings: PricingWarning[] = [];
      if (score < 25) {
        warnings.push({
          code: "low_match_confidence",
          severity: "warning",
          message: "Low confidence match — verify support item before invoicing.",
        });
      }
      return {
        supportItemId: item.id,
        code: item.code,
        name: item.name,
        score,
        confidence: confidenceFromScore(score),
        reasons,
        warnings,
      };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 5);

  return {
    matches: scored,
    disclaimer:
      "Suggested support items are based on your catalogue data only. They are not NDIA approvals.",
  };
}
