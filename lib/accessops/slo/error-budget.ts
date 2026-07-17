export function calculateErrorBudgetRemaining(
  target: number,
  observed: number,
): number | null {
  if (target <= 0) return null;
  return Math.max(0, (observed - target) / target);
}

export function isErrorBudgetExhausted(remaining: number | null): boolean {
  return remaining !== null && remaining <= 0;
}
