export type BackpressureAction =
  | "accept"
  | "throttle"
  | "shed";

export interface BackpressureDecision {
  action: BackpressureAction;
  reason: string;
  retryAfterSeconds?: number;
}

/**
 * Simple back-pressure: shed when a tenant is above hard limit; throttle when
 * within warning band; accept otherwise. Callers pass current concurrency and
 * the tenant's configured hard/warn limits.
 */
export function evaluateBackpressure(input: {
  current: number;
  warnAt: number;
  hardAt: number;
}): BackpressureDecision {
  if (input.current >= input.hardAt) {
    return {
      action: "shed",
      reason: "hard_limit_exceeded",
      retryAfterSeconds: 30,
    };
  }
  if (input.current >= input.warnAt) {
    return {
      action: "throttle",
      reason: "warn_band",
      retryAfterSeconds: 5,
    };
  }
  return { action: "accept", reason: "under_limit" };
}
