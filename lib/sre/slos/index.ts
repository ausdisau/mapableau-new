export interface Slo {
  key: string;
  target: number;
  window: "24h" | "7d" | "28d";
  metric: "availability" | "latency_p95_ms" | "error_ratio";
  threshold?: number;
}

/**
 * Given an availability ratio in [0,1] and a target in [0,1], compute the
 * fraction of the error budget burned so far in the window.
 */
export function computeErrorBudgetBurn(
  availability: number,
  target: number
): number {
  if (target >= 1 || target <= 0) return 0;
  const budget = 1 - target;
  const consumed = Math.max(0, 1 - Math.max(0, Math.min(1, availability)));
  return consumed / budget;
}
