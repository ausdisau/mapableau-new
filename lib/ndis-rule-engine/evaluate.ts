import type {
  NdisRuleContext,
  NdisRuleDefinition,
  ReviewFlag,
  RuleOutcome,
  RuleResult,
} from "@/lib/ndis-rule-engine/types";

function maxOutcome(a: RuleOutcome, b: RuleOutcome): RuleOutcome {
  const rank: Record<RuleOutcome, number> = {
    allowed: 0,
    reviewRequired: 1,
    blocked: 2,
  };
  return rank[b] > rank[a] ? b : a;
}

export function evaluateNdisRules(
  context: NdisRuleContext,
  rules: NdisRuleDefinition[],
): RuleResult {
  let outcome: RuleOutcome = "allowed";
  const reasons: string[] = [];
  const flags: ReviewFlag[] = [];

  for (const rule of rules) {
    if (!rule.when(context)) continue;
    outcome = maxOutcome(outcome, rule.outcome);
    reasons.push(rule.message);
    flags.push({ ...rule.flag, code: `${rule.flag.code}:${rule.id}` });
  }

  return { outcome, reasons, flags };
}
