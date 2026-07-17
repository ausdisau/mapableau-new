export type StopConditionInput = {
  openCriticalSignals: number;
  limitBreachCount: number;
  unacknowledgedIncidents: number;
  maxCriticalSignals: number;
  maxLimitBreaches: number;
};

export type StopConditionResult = {
  shouldStop: boolean;
  reasons: string[];
};

/** Deterministic stop-condition evaluation — human must still pause. */
export function evaluateStopConditions(
  input: StopConditionInput
): StopConditionResult {
  const reasons: string[] = [];
  if (input.openCriticalSignals >= input.maxCriticalSignals) {
    reasons.push("CRITICAL_SIGNAL_THRESHOLD");
  }
  if (input.limitBreachCount >= input.maxLimitBreaches) {
    reasons.push("LIMIT_BREACH_THRESHOLD");
  }
  if (input.unacknowledgedIncidents > 0) {
    reasons.push("UNACKNOWLEDGED_INCIDENTS");
  }
  return { shouldStop: reasons.length > 0, reasons };
}
