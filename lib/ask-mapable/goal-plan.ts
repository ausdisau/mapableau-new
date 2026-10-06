import {
  buildGoalPlanDraft,
  type GoalPlanDraft,
} from "@mapable/contracts";

import type { CopilotIntentType } from "@/lib/copilot/types";

const ELIGIBLE_INTENTS = new Set<CopilotIntentType>([
  "support",
  "transport",
  "combined",
  "jobs",
  "places",
  "unknown",
]);

const STEP_BY_STEP =
  /\b(one at a time|step[- ]?by[- ]?step|ask me each)\b/i;

export function maybeBuildGoalPlanForAsk(input: {
  query: string;
  intent: CopilotIntentType;
}): GoalPlanDraft | null {
  if (!ELIGIBLE_INTENTS.has(input.intent)) return null;

  const plan = buildGoalPlanDraft(input.query, {
    stepByStep: STEP_BY_STEP.test(input.query),
  });

  if (plan.needsClarification && plan.serviceCandidates.length === 0) {
    return null;
  }

  return plan;
}
