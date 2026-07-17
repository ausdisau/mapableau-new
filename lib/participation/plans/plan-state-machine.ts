import type { ParticipationPlanStatusValue } from "@/lib/participation/types";

const TRANSITIONS: Record<
  ParticipationPlanStatusValue,
  ParticipationPlanStatusValue[]
> = {
  draft: ["simulated", "approved", "cancelled"],
  simulated: ["approved", "cancelled"],
  awaiting_approval: ["approved", "cancelled"],
  approved: ["executing", "cancelled"],
  executing: ["completed", "paused", "cancelled"],
  completed: [],
  cancelled: [],
  paused: ["executing", "cancelled"],
};

export function canTransitionParticipationPlan(
  from: ParticipationPlanStatusValue,
  to: ParticipationPlanStatusValue,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertParticipationPlanTransition(
  from: ParticipationPlanStatusValue,
  to: ParticipationPlanStatusValue,
) {
  if (!canTransitionParticipationPlan(from, to)) {
    throw new Error(`INVALID_PARTICIPATION_PLAN_TRANSITION:${from}:${to}`);
  }
}

export function cancellationBlocksFutureAccess(): false {
  return false;
}
