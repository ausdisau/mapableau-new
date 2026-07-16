import { PhysicalSystemsError } from "../errors";
import type {
  PhysicalActionExecution,
  PhysicalActionState,
} from "../schemas";

export type ActionTransitionEvent =
  | { type: "request_user_approval" }
  | { type: "request_venue_approval" }
  | { type: "user_approved" }
  | { type: "venue_approved" }
  | { type: "all_approvals_complete" }
  | { type: "start_execute" }
  | { type: "start_verify" }
  | { type: "succeed" }
  | { type: "fail"; code?: string; message?: string }
  | { type: "timeout" }
  | { type: "cancel" }
  | { type: "rollback" };

const VALID_TRANSITIONS: Record<
  PhysicalActionState,
  ReadonlySet<PhysicalActionState>
> = {
  proposed: new Set([
    "awaiting_user_approval",
    "awaiting_venue_approval",
    "approved",
    "cancelled",
  ]),
  awaiting_user_approval: new Set([
    "awaiting_venue_approval",
    "approved",
    "cancelled",
  ]),
  awaiting_venue_approval: new Set(["approved", "cancelled"]),
  approved: new Set(["executing", "cancelled", "timed_out", "failed"]),
  executing: new Set(["verifying", "failed", "timed_out", "cancelled"]),
  verifying: new Set(["succeeded", "failed", "timed_out", "rolled_back"]),
  succeeded: new Set(),
  failed: new Set(["rolled_back"]),
  cancelled: new Set(),
  timed_out: new Set(["rolled_back"]),
  rolled_back: new Set(),
};

export function canTransition(
  from: PhysicalActionState,
  to: PhysicalActionState,
): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from]?.has(to) ?? false;
}

function assertTransition(
  from: PhysicalActionState,
  to: PhysicalActionState,
): void {
  if (!canTransition(from, to)) {
    throw new PhysicalSystemsError(
      "INVALID_TRANSITION",
      `Invalid physical action transition from ${from} to ${to}.`,
      undefined,
      { from, to },
    );
  }
}

function eventTargetState(
  execution: PhysicalActionExecution,
  event: ActionTransitionEvent,
): PhysicalActionState {
  switch (event.type) {
    case "request_user_approval":
      return "awaiting_user_approval";
    case "request_venue_approval":
      return "awaiting_venue_approval";
    case "user_approved": {
      if (
        execution.proposal.requireVenueApproval &&
        !execution.approvals.some((a) => a.kind === "venue")
      ) {
        return "awaiting_venue_approval";
      }
      return "approved";
    }
    case "venue_approved": {
      if (
        execution.proposal.requireUserApproval &&
        !execution.approvals.some((a) => a.kind === "user")
      ) {
        return "awaiting_user_approval";
      }
      return "approved";
    }
    case "all_approvals_complete":
      return "approved";
    case "start_execute":
      return "executing";
    case "start_verify":
      return "verifying";
    case "succeed":
      return "succeeded";
    case "fail":
      return "failed";
    case "timeout":
      return "timed_out";
    case "cancel":
      return "cancelled";
    case "rollback":
      return "rolled_back";
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

export function transitionAction(
  execution: PhysicalActionExecution,
  event: ActionTransitionEvent,
): PhysicalActionExecution {
  const nextState = eventTargetState(execution, event);
  assertTransition(execution.state, nextState);

  const now = new Date().toISOString();
  const next: PhysicalActionExecution = {
    ...execution,
    state: nextState,
    updatedAt: now,
  };

  if (event.type === "start_execute") {
    next.startedAt = now;
  }
  if (
    event.type === "succeed" ||
    event.type === "fail" ||
    event.type === "timeout" ||
    event.type === "cancel" ||
    event.type === "rollback"
  ) {
    next.completedAt = now;
  }
  if (event.type === "fail") {
    next.errorCode = event.code;
    next.errorMessage = event.message;
  }
  if (event.type === "timeout") {
    next.errorCode = "TIMEOUT";
    next.errorMessage = next.errorMessage ?? "Action timed out.";
  }

  return next;
}

export function getValidTransitions(): typeof VALID_TRANSITIONS {
  return VALID_TRANSITIONS;
}
