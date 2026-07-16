import type { PilotStatus } from "@prisma/client";

/**
 * Allowed ControlledPilot status transitions.
 * Terminal: closed. AI must never auto-transition.
 */
export const PILOT_STATUS_TRANSITIONS: Record<PilotStatus, readonly PilotStatus[]> = {
  draft: ["pending_decision", "closed"],
  pending_decision: ["approved", "draft", "closed"],
  approved: ["active", "closed"],
  active: ["paused", "draining", "terminated"],
  paused: ["active", "draining", "terminated"],
  draining: ["terminated", "closed"],
  terminated: ["closed"],
  closed: [],
};

export function canTransitionPilotStatus(
  from: PilotStatus,
  to: PilotStatus
): boolean {
  if (from === to) return false;
  return PILOT_STATUS_TRANSITIONS[from].includes(to);
}

export function assertCanTransitionPilotStatus(
  from: PilotStatus,
  to: PilotStatus
): void {
  if (!canTransitionPilotStatus(from, to)) {
    throw new Error(`PILOT_STATUS_TRANSITION_DENIED:${from}->${to}`);
  }
}

export function isPilotOperationallyActive(status: PilotStatus): boolean {
  return status === "active";
}

export function isPilotTerminal(status: PilotStatus): boolean {
  return status === "closed" || status === "terminated";
}
