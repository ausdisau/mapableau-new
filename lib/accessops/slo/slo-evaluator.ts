import type { AccessSloProfile } from "@prisma/client";

export interface SloEvaluation {
  breached: boolean;
  observedValue: number;
  targetValue: number;
  errorBudgetRemaining: number | null;
  reviewRequired: boolean;
}

export function evaluateSlo(
  profile: Pick<AccessSloProfile, "targetValue">,
  observedValue: number,
): SloEvaluation {
  const remaining =
    profile.targetValue === 0
      ? null
      : (profile.targetValue - observedValue) / profile.targetValue;
  return {
    breached: observedValue < profile.targetValue,
    observedValue,
    targetValue: profile.targetValue,
    errorBudgetRemaining: remaining,
    reviewRequired: observedValue < profile.targetValue,
  };
}
