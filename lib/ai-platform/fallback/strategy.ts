/**
 * Fallback strategy when the selected model errors. AURA never falls back to
 * "just do it deterministically" — it falls back to human handoff or to a
 * cached simulation output.
 */

export type FallbackReason =
  | "model_error"
  | "model_timeout"
  | "model_disabled"
  | "policy_blocked";

export interface FallbackDecision {
  action: "human_handoff" | "cached_simulation" | "abort";
  reason: FallbackReason;
  message: string;
}

export function chooseFallback(
  reason: FallbackReason,
  simulationAvailable: boolean
): FallbackDecision {
  switch (reason) {
    case "policy_blocked":
      return {
        action: "abort",
        reason,
        message: "Policy blocked the model call; a human review is required.",
      };
    case "model_disabled":
      return {
        action: "human_handoff",
        reason,
        message: "No usable model — handing off to a human coordinator.",
      };
    case "model_error":
    case "model_timeout":
      if (simulationAvailable) {
        return {
          action: "cached_simulation",
          reason,
          message:
            "Model unavailable; falling back to cached simulation output. Actions still require human approval.",
        };
      }
      return {
        action: "human_handoff",
        reason,
        message: "Model unavailable; handing off to a human coordinator.",
      };
    default: {
      const _exhaustive: never = reason;
      throw new Error(`Unhandled fallback reason: ${_exhaustive}`);
    }
  }
}
