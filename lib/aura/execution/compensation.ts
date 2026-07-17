/**
 * Compensation ledger. When a step in `execution_unknown` or `failed` state
 * cannot be resolved by retry, a compensation record is required. The engine
 * fails closed: no execution may transition to `completed` while any
 * high-risk step is still awaiting compensation.
 */

export interface CompensationInput {
  executionId: string;
  reason: string;
  compensatedStep: {
    stepIndex: number;
    actionSlug: string;
    priorState: string;
  };
  successful: boolean;
}

export function requiresCompensation(state: string, riskTier: string): boolean {
  if (state === "execution_unknown") return true;
  if (state === "failed" && (riskTier === "high_irreversible" || riskTier === "medium_reversible")) {
    return true;
  }
  return false;
}
