export type CanaryPlan = {
  percent: number;
  maxParticipants: number;
  observeHours: number;
};

export function buildCanaryPlan(stage: string): CanaryPlan {
  if (stage === "limited_live" || stage === "controlled_live") {
    return { percent: 5, maxParticipants: 3, observeHours: 24 };
  }
  return { percent: 100, maxParticipants: Number.MAX_SAFE_INTEGER, observeHours: 0 };
}

export function canaryAllowsParticipant(input: {
  plan: CanaryPlan;
  canaryCohortSize: number;
  participantIndex: number;
}): boolean {
  if (input.plan.percent >= 100) return true;
  if (input.canaryCohortSize >= input.plan.maxParticipants) return false;
  return input.participantIndex % 100 < input.plan.percent;
}
