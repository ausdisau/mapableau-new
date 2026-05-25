import { readFileSync } from "fs";
import { join } from "path";

import type {
  GuardrailEvaluationResult,
  PolicyOutcome,
  RiskTier,
} from "@/lib/mapable-graphs/types";

export interface NdisGuardrailRule {
  id: string;
  title: string;
  riskTier: RiskTier;
  outcome: PolicyOutcome;
  patterns: string[];
  explanation: string;
}

let cachedRules: NdisGuardrailRule[] | null = null;

export function loadNdisGuardrailRules(): NdisGuardrailRule[] {
  if (cachedRules) return cachedRules;

  const fallbackPath = join(
    process.cwd(),
    "data",
    "ndis-guardrails-fallback.json"
  );
  try {
    const raw = readFileSync(fallbackPath, "utf-8");
    cachedRules = JSON.parse(raw) as NdisGuardrailRule[];
    return cachedRules;
  } catch {
    cachedRules = [
      {
        id: "fallback_draft",
        title: "Default draft-only",
        riskTier: "tier_1",
        outcome: "ALLOW_DRAFT_ONLY",
        patterns: [],
        explanation: "AI and graph suggestions remain drafts until confirmed.",
      },
    ];
    return cachedRules;
  }
}

export async function loadGuardrailRulesFromAirtable(): Promise<
  NdisGuardrailRule[] | null
> {
  const baseId = process.env.AIRTABLE_NDIS_GUARDRAIL_BASE_ID;
  const table = process.env.AIRTABLE_NDIS_GUARDRAIL_TABLE;
  const token = process.env.AIRTABLE_API_KEY;
  if (!baseId || !table || !token) return null;

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?maxRecords=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      records: Array<{ fields: Record<string, unknown> }>;
    };
    return body.records.map((r) => ({
      id: String(r.fields.id ?? r.fields.rule_id ?? "airtable_rule"),
      title: String(r.fields.title ?? "NDIS rule"),
      riskTier: (r.fields.risk_tier as RiskTier) ?? "tier_1",
      outcome: (r.fields.outcome as PolicyOutcome) ?? "REQUIRE_PARTICIPANT_CONFIRMATION",
      patterns: Array.isArray(r.fields.patterns)
        ? (r.fields.patterns as string[])
        : String(r.fields.patterns ?? "")
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
      explanation: String(
        r.fields.explanation ?? "NDIS guardrail applies to this action."
      ),
    }));
  } catch {
    return null;
  }
}

export async function getActiveGuardrailRules(): Promise<NdisGuardrailRule[]> {
  const remote = await loadGuardrailRulesFromAirtable();
  if (remote?.length) return remote;
  return loadNdisGuardrailRules();
}

export function evaluateActionAgainstRules(
  action: string,
  context: Record<string, unknown> = {},
  rules: NdisGuardrailRule[]
): GuardrailEvaluationResult {
  const haystack = `${action} ${JSON.stringify(context)}`.toLowerCase();
  let best: GuardrailEvaluationResult = {
    outcome: "ALLOW_DRAFT_ONLY",
    riskTier: "tier_0",
    explanation: "No matching guardrail; draft-only by default.",
    checkpointRequired: false,
    ruleIds: [],
  };

  const tierRank: Record<RiskTier, number> = {
    tier_0: 0,
    tier_1: 1,
    tier_2: 2,
    tier_3: 3,
    tier_4: 4,
  };

  const outcomeStrictness: Record<PolicyOutcome, number> = {
    ALLOW_AUTOMATION: 0,
    ALLOW_DRAFT_ONLY: 1,
    REQUIRE_PARTICIPANT_CONFIRMATION: 2,
    REQUIRE_SCOPED_CONSENT: 3,
    REQUIRE_CREDENTIAL_AND_TRAINING_CHECK: 4,
    REQUIRE_HUMAN_REVIEW: 5,
    ESCALATE_SAFEGUARDING: 6,
    BLOCK: 7,
  };

  for (const rule of rules) {
    const matched = rule.patterns.some((p) =>
      p ? haystack.includes(p.toLowerCase()) : false
    );
    if (!matched) continue;
    const tierHigher = tierRank[rule.riskTier] > tierRank[best.riskTier];
    const sameTierStricter =
      tierRank[rule.riskTier] === tierRank[best.riskTier] &&
      outcomeStrictness[rule.outcome] > outcomeStrictness[best.outcome];
    if (tierHigher || sameTierStricter) {
      best = {
        outcome: rule.outcome,
        riskTier: rule.riskTier,
        explanation: rule.explanation,
        checkpointRequired:
          rule.outcome === "REQUIRE_PARTICIPANT_CONFIRMATION" ||
          rule.outcome === "REQUIRE_HUMAN_REVIEW" ||
          rule.outcome === "ESCALATE_SAFEGUARDING" ||
          rule.outcome === "REQUIRE_SCOPED_CONSENT",
        ruleIds: [...best.ruleIds, rule.id],
      };
    }
  }

  if (
    /\b(abuse|unsafe|angry when i complain|neglect|harm)\b/i.test(action) ||
    context.safeguarding === true
  ) {
    best = {
      outcome: "ESCALATE_SAFEGUARDING",
      riskTier: "tier_4",
      explanation:
        "Safeguarding signal detected. Normal booking flow may be paused pending review.",
      checkpointRequired: true,
      ruleIds: [...best.ruleIds, "ndis_safeguarding"],
    };
  }

  return best;
}
