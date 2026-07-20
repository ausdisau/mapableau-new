import type { PbsPlanStatus } from "./types";

/**
 * Deterministic plan lifecycle. Only domain services may transition status.
 * Never accept lifecycle status directly from an unrestricted client request.
 */
const TRANSITIONS: Record<PbsPlanStatus, PbsPlanStatus[]> = {
  draft: ["assessment_in_progress", "archived"],
  assessment_in_progress: ["consultation", "draft", "archived"],
  consultation: ["practitioner_review", "assessment_in_progress", "archived"],
  practitioner_review: ["finalised", "consultation", "archived"],
  finalised: ["active", "superseded", "archived"],
  active: ["review_due", "superseded", "archived"],
  review_due: ["practitioner_review", "superseded", "archived"],
  superseded: ["archived"],
  archived: [],
};

export function canTransitionPbsPlanStatus(
  from: PbsPlanStatus,
  to: PbsPlanStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertPbsPlanTransition(
  from: PbsPlanStatus,
  to: PbsPlanStatus,
): void {
  if (!canTransitionPbsPlanStatus(from, to)) {
    throw new Error(`Invalid PBS plan status transition: ${from} → ${to}`);
  }
}

export function isPbsPlanTerminal(status: PbsPlanStatus): boolean {
  return status === "archived" || status === "superseded";
}

/** Finalised versions are immutable; corrections require a new version. */
export function isPbsPlanVersionImmutable(status: PbsPlanStatus): boolean {
  return (
    status === "finalised" ||
    status === "active" ||
    status === "review_due" ||
    status === "superseded" ||
    status === "archived"
  );
}

export function listPbsPlanTransitions(from: PbsPlanStatus): PbsPlanStatus[] {
  return [...TRANSITIONS[from]];
}
