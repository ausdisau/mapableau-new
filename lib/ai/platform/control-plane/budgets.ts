import { assertModelCallAllowed } from "@/lib/ai/platform/policies/kill-switches";
import {
  aiControlPlaneConfig,
  isAiControlPlaneEnabled,
} from "@/lib/config/ai-control-plane";

import { getCircuitState, recordCircuitFailure } from "./circuit-breakers";
import { incrementMetric } from "./metrics";
import type { BudgetDecision, BudgetScope, TokenBudget } from "./types";

/**
 * Model cost control — per-capability / per-mission budgets.
 * Exhaustion degrades to deterministic or manual behaviour (never unbounded spend).
 */

const budgets = new Map<string, TokenBudget>();

function budgetKey(scope: BudgetScope, scopeId: string): string {
  return `${scope}:${scopeId}`;
}

export function configureTokenBudget(input: {
  scope: BudgetScope;
  scopeId: string;
  maxTokens: number;
  maxModelCalls: number;
}): TokenBudget {
  if (input.maxTokens < 0 || input.maxModelCalls < 0) {
    throw new Error("budget_limits_must_be_non_negative");
  }
  const key = budgetKey(input.scope, input.scopeId);
  const existing = budgets.get(key);
  const next: TokenBudget = {
    scope: input.scope,
    scopeId: input.scopeId,
    maxTokens: input.maxTokens,
    usedTokens: existing?.usedTokens ?? 0,
    maxModelCalls: input.maxModelCalls,
    usedModelCalls: existing?.usedModelCalls ?? 0,
  };
  budgets.set(key, next);
  return { ...next };
}

export function getTokenBudget(
  scope: BudgetScope,
  scopeId: string,
): TokenBudget | null {
  const found = budgets.get(budgetKey(scope, scopeId));
  return found ? { ...found } : null;
}

function fallbackForExhaustion(): "deterministic" | "manual" | "cheaper_route" {
  if (aiControlPlaneConfig.cheaperFallbackRouteEnabled) {
    return "cheaper_route";
  }
  return "deterministic";
}

/**
 * Decide whether a model call may proceed under budgets + kill switch + circuits.
 */
export function authorizeModelSpend(input: {
  capabilityKey: string;
  missionId?: string;
  tenantId?: string | null;
  estimatedTokens: number;
}): BudgetDecision {
  if (!isAiControlPlaneEnabled()) {
    const kill = assertModelCallAllowed({
      capabilityKey: input.capabilityKey,
      tenantId: input.tenantId,
    });
    if (!kill.allowed) {
      return {
        allowed: false,
        reason: "kill_switch",
        fallback: "manual",
      };
    }
    return {
      allowed: true,
      remainingTokens: Number.POSITIVE_INFINITY,
      remainingCalls: Number.POSITIVE_INFINITY,
    };
  }

  const kill = assertModelCallAllowed({
    capabilityKey: input.capabilityKey,
    tenantId: input.tenantId,
  });
  if (!kill.allowed) {
    incrementMetric("kill_switch_activations");
    incrementMetric("manual_fallbacks");
    return { allowed: false, reason: "kill_switch", fallback: "manual" };
  }

  const modelCircuit = getCircuitState("model_provider", "default");
  if (modelCircuit?.state === "open") {
    incrementMetric("deterministic_fallbacks");
    return {
      allowed: false,
      reason: "circuit_open",
      fallback: "deterministic",
    };
  }

  const costCircuit = getCircuitState("cost_threshold", "global");
  if (costCircuit?.state === "open") {
    incrementMetric("budget_exhaustions");
    incrementMetric("deterministic_fallbacks");
    return {
      allowed: false,
      reason: "cost_threshold",
      fallback: fallbackForExhaustion(),
    };
  }

  const scopes: Array<{ scope: BudgetScope; scopeId: string }> = [
    { scope: "capability", scopeId: input.capabilityKey },
  ];
  if (input.missionId) {
    scopes.push({ scope: "mission", scopeId: input.missionId });
  }
  scopes.push({ scope: "global", scopeId: "default" });

  for (const { scope, scopeId } of scopes) {
    const budget = budgets.get(budgetKey(scope, scopeId));
    if (!budget) continue;

    if (budget.usedModelCalls >= budget.maxModelCalls) {
      incrementMetric("budget_exhaustions");
      incrementMetric("deterministic_fallbacks");
      recordCircuitFailure(
        "cost_threshold",
        "global",
        "model_call_budget_exhausted",
      );
      return {
        allowed: false,
        reason: "model_call_budget_exhausted",
        fallback: fallbackForExhaustion(),
      };
    }

    if (budget.usedTokens + input.estimatedTokens > budget.maxTokens) {
      incrementMetric("budget_exhaustions");
      incrementMetric("deterministic_fallbacks");
      recordCircuitFailure(
        "cost_threshold",
        "global",
        "token_budget_exhausted",
      );
      return {
        allowed: false,
        reason: "token_budget_exhausted",
        fallback: fallbackForExhaustion(),
      };
    }
  }

  const capabilityBudget = budgets.get(
    budgetKey("capability", input.capabilityKey),
  );
  const remainingTokens = capabilityBudget
    ? Math.max(0, capabilityBudget.maxTokens - capabilityBudget.usedTokens)
    : Number.POSITIVE_INFINITY;
  const remainingCalls = capabilityBudget
    ? Math.max(
        0,
        capabilityBudget.maxModelCalls - capabilityBudget.usedModelCalls,
      )
    : Number.POSITIVE_INFINITY;

  return { allowed: true, remainingTokens, remainingCalls };
}

export function recordModelSpend(input: {
  capabilityKey: string;
  missionId?: string;
  tokens: number;
}): void {
  if (!isAiControlPlaneEnabled()) return;
  if (input.tokens < 0) throw new Error("tokens_must_be_non_negative");

  const scopes: Array<{ scope: BudgetScope; scopeId: string }> = [
    { scope: "capability", scopeId: input.capabilityKey },
    { scope: "global", scopeId: "default" },
  ];
  if (input.missionId) {
    scopes.push({ scope: "mission", scopeId: input.missionId });
  }

  for (const { scope, scopeId } of scopes) {
    const key = budgetKey(scope, scopeId);
    const budget = budgets.get(key);
    if (!budget) continue;
    budget.usedTokens += input.tokens;
    budget.usedModelCalls += 1;
  }

  incrementMetric("model_calls");
  incrementMetric("model_tokens", input.tokens);
}

export function clearBudgets(): void {
  budgets.clear();
}

export function listBudgets(): TokenBudget[] {
  return [...budgets.values()].map((b) => ({ ...b }));
}
