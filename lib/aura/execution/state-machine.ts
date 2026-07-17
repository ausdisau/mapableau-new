import type { AuraExecutionState, AuraStepExecutionState } from "@prisma/client";

/**
 * Durable execution state machine. Execution transitions are strict; the
 * `execution_unknown` state exists so a partial failure never leaves the
 * ledger claiming success when we can't verify. Compensation is the only path
 * out of a failed high-risk step.
 */

const EXECUTION_TRANSITIONS: Record<AuraExecutionState, AuraExecutionState[]> = {
  queued: ["running", "cancelled", "paused"],
  running: [
    "waiting_approval",
    "paused",
    "completed",
    "failed",
    "execution_unknown",
    "cancelled",
  ],
  waiting_approval: ["running", "cancelled", "failed"],
  paused: ["running", "cancelled"],
  execution_unknown: ["compensated", "failed", "cancelled"],
  completed: [],
  failed: ["compensated"],
  compensated: [],
  cancelled: [],
};

const STEP_TRANSITIONS: Record<
  AuraStepExecutionState,
  AuraStepExecutionState[]
> = {
  pending: ["running", "skipped"],
  running: ["succeeded", "failed", "execution_unknown", "skipped"],
  execution_unknown: ["compensated", "failed"],
  succeeded: [],
  failed: ["compensated"],
  compensated: [],
  skipped: [],
};

export function canTransitionExecution(
  from: AuraExecutionState,
  to: AuraExecutionState
): boolean {
  return EXECUTION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canTransitionStep(
  from: AuraStepExecutionState,
  to: AuraStepExecutionState
): boolean {
  return STEP_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalExecution(state: AuraExecutionState): boolean {
  switch (state) {
    case "completed":
    case "cancelled":
    case "compensated":
      return true;
    case "queued":
    case "running":
    case "waiting_approval":
    case "paused":
    case "execution_unknown":
    case "failed":
      return false;
    default: {
      const _exhaustive: never = state;
      throw new Error(`Unhandled execution state: ${_exhaustive}`);
    }
  }
}

export function isTerminalStep(state: AuraStepExecutionState): boolean {
  switch (state) {
    case "succeeded":
    case "skipped":
    case "compensated":
      return true;
    case "pending":
    case "running":
    case "execution_unknown":
    case "failed":
      return false;
    default: {
      const _exhaustive: never = state;
      throw new Error(`Unhandled step state: ${_exhaustive}`);
    }
  }
}
