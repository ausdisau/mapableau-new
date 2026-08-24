import {
  getModel,
  listPortfolioModels,
  type NativeIntelligenceTaskKind,
  type ModelRegistration,
} from "@/lib/ai/platform/models/registry";

/**
 * MapAble-owned model portfolio helpers.
 * Extends the canonical registry — does not create a second registry.
 */

export type PortfolioSummary = {
  totalModels: number;
  byDeployment: Record<string, number>;
  byEvaluationStatus: Record<string, number>;
  rndOnlyCount: number;
  productionEligibleCount: number;
};

export function summarisePortfolio(): PortfolioSummary {
  const models = listPortfolioModels();
  const byDeployment: Record<string, number> = {};
  const byEvaluationStatus: Record<string, number> = {};
  let rndOnlyCount = 0;
  let productionEligibleCount = 0;

  for (const m of models) {
    const dep = m.deploymentType ?? "unspecified";
    byDeployment[dep] = (byDeployment[dep] ?? 0) + 1;
    const status = m.evaluationStatus ?? "unevaluated";
    byEvaluationStatus[status] = (byEvaluationStatus[status] ?? 0) + 1;
    if (m.rndOnly) rndOnlyCount += 1;
    if (
      status === "approved_for_production" ||
      status === "approved_for_pilot"
    ) {
      productionEligibleCount += 1;
    }
  }

  return {
    totalModels: models.length,
    byDeployment,
    byEvaluationStatus,
    rndOnlyCount,
    productionEligibleCount,
  };
}

export function candidatesForTask(
  taskKind: NativeIntelligenceTaskKind
): ModelRegistration[] {
  return listPortfolioModels().filter((m) =>
    (m.taskSuitability ?? []).includes(taskKind)
  );
}

export function resolveFallbackChain(modelId: string): string[] {
  const seen = new Set<string>();
  const chain: string[] = [];
  let current: string | undefined = modelId;
  while (current && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    const model = getModel(current);
    current = model?.fallbackModelIds?.[0];
  }
  return chain;
}

/**
 * High-impact permission / policy decisions remain deterministic
 * regardless of which model is in the portfolio.
 */
export function taskRequiresDeterministicPolicy(
  taskKind: NativeIntelligenceTaskKind | string
): boolean {
  return (
    taskKind === "permission_decision" ||
    taskKind === "action_execution" ||
    taskKind === "mission_policy"
  );
}
