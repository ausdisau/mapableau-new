import {
  goalPlanDraftSchema,
  type GoalPlanDraft,
  type GoalServiceCandidate,
  type GoalServiceModule,
  type ParticipantDecision,
} from "./goal-plan";

export const STEP_BY_STEP_PREFERENCE = "decision_mode:step_by_step" as const;

type CandidateDefinition = Omit<
  GoalServiceCandidate,
  | "decision"
  | "requirements"
  | "nonNegotiables"
  | "uncertainties"
  | "dataRequired"
  | "proposedDisclosure"
> & {
  matches: RegExp[];
};

const CANDIDATE_DEFINITIONS: CandidateDefinition[] = [
  {
    module: "jobs",
    reasonSuggested:
      "Your goal mentions work, employment, a career, or a workplace outcome.",
    participantBenefit:
      "MapAble can help you explore employment options without making assumptions about your capability.",
    question:
      "Would you like me to include Jobs in this Goal Plan?",
    confidence: "high",
    sensitivity: "ordinary",
    askConversationally: false,
    requiresExplicitChoice: false,
    matches: [
      /\bjob\b/i,
      /\bjobs\b/i,
      /\bwork\b/i,
      /\bworking\b/i,
      /\bemployment\b/i,
      /\binterview\b/i,
      /\bworkplace\b/i,
      /\bcareer\b/i,
    ],
  },
  {
    module: "access",
    reasonSuggested:
      "Your goal includes an accessibility feature or access requirement.",
    participantBenefit:
      "MapAble can keep accessibility requirements visible while comparing places and services.",
    question:
      "Would you like me to include Access in this Goal Plan?",
    confidence: "high",
    sensitivity: "ordinary",
    askConversationally: false,
    requiresExplicitChoice: false,
    matches: [
      /\baccessible\b/i,
      /\baccessibility\b/i,
      /\bstep[- ]free\b/i,
      /\bwheelchair\b/i,
      /\baccessible toilet\b/i,
      /\bramp\b/i,
      /\blift\b/i,
      /\bhearing loop\b/i,
      /\bquiet space\b/i,
    ],
  },
  {
    module: "transport",
    reasonSuggested:
      "Your goal mentions travel, a journey, or getting somewhere.",
    participantBenefit:
      "MapAble can help compare transport options while preserving your stated access requirements.",
    question:
      "Would you like me to include Transport in this Goal Plan?",
    confidence: "high",
    sensitivity: "ordinary",
    askConversationally: false,
    requiresExplicitChoice: false,
    matches: [
      /\btransport\b/i,
      /\btravel\b/i,
      /\bjourney\b/i,
      /\bcommute\b/i,
      /\bride\b/i,
      /\bbus\b/i,
      /\btrain\b/i,
      /\btaxi\b/i,
      /\bget there\b/i,
      /\bget to\b/i,
      /\bpick[- ]?up\b/i,
    ],
  },
  {
    module: "care",
    reasonSuggested:
      "You explicitly mentioned personal support or support-worker assistance.",
    participantBenefit:
      "You can decide whether Care belongs in the plan without any support need being inferred from disability or diagnosis.",
    question:
      "Would you like me to include Care in this Goal Plan?",
    confidence: "high",
    sensitivity: "sensitive",
    askConversationally: true,
    requiresExplicitChoice: true,
    matches: [
      /\bsupport worker\b/i,
      /\bcare worker\b/i,
      /\bsupport person\b/i,
      /\bpersonal care\b/i,
      /\bpersonal support\b/i,
      /\bdaily living support\b/i,
      /\bhelp(?: me)? (?:to )?get ready\b/i,
      /\bhelp getting ready\b/i,
      /\bhelp(?: me)? with (?:my )?(?:morning routine|self[- ]care|showering|dressing|meal preparation|meal prep)\b/i,
    ],
  },
];

function matchesAny(goal: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(goal));
}

function toCandidate(definition: CandidateDefinition): GoalServiceCandidate {
  const { matches: _matches, ...candidate } = definition;

  return {
    ...candidate,
    decision: "undecided",
    requirements: [],
    nonNegotiables: [],
    uncertainties: [],
    dataRequired: [],
    proposedDisclosure: [],
  };
}

export function shouldAskConversationally(
  candidate: GoalServiceCandidate,
): boolean {
  return (
    candidate.askConversationally ||
    candidate.requiresExplicitChoice ||
    candidate.sensitivity !== "ordinary" ||
    candidate.confidence === "low" ||
    candidate.uncertainties.length > 0 ||
    candidate.proposedDisclosure.length > 0
  );
}

export function buildGoalPlanDraft(
  goal: string,
  options?: { stepByStep?: boolean },
): GoalPlanDraft {
  const normalizedGoal = goal.trim();
  const serviceCandidates = normalizedGoal
    ? CANDIDATE_DEFINITIONS.filter((definition) =>
        matchesAny(normalizedGoal, definition.matches),
      ).map(toCandidate)
    : [];

  const needsClarification =
    normalizedGoal.length === 0 || serviceCandidates.length === 0;

  return goalPlanDraftSchema.parse({
    goal: normalizedGoal,
    participantConfirmed: false,
    needsClarification,
    clarificationPrompt: needsClarification
      ? normalizedGoal
        ? "I understand the goal, but I am not yet sure which MapAble services fit. What part would you like help with first?"
        : "What would you like to achieve? You can describe a goal in your own words."
      : undefined,
    desiredOutcomes: normalizedGoal ? [normalizedGoal] : [],
    preferences: options?.stepByStep ? [STEP_BY_STEP_PREFERENCE] : [],
    nonNegotiables: [],
    accessibilityRequirements: [],
    communicationRequirements: [],
    exclusions: [],
    serviceCandidates,
    disclosurePermissions: [],
    uncertainties: [],
    humanHelpRequested: false,
    status: "draft",
  });
}

export function setGoalPlanDecision(
  plan: GoalPlanDraft,
  module: GoalServiceModule,
  decision: ParticipantDecision,
): GoalPlanDraft {
  return goalPlanDraftSchema.parse({
    ...plan,
    serviceCandidates: plan.serviceCandidates.map((candidate) =>
      candidate.module === module ? { ...candidate, decision } : candidate,
    ),
    status: "review",
  });
}

export function nextConversationalCandidate(
  plan: GoalPlanDraft,
): GoalServiceCandidate | null {
  const stepByStep = plan.preferences.includes(STEP_BY_STEP_PREFERENCE);

  return (
    plan.serviceCandidates.find(
      (candidate) =>
        candidate.decision === "undecided" &&
        (stepByStep || shouldAskConversationally(candidate)),
    ) ?? null
  );
}

export function confirmGoalPlan(plan: GoalPlanDraft): GoalPlanDraft {
  if (plan.needsClarification) {
    throw new Error("GOAL_PLAN_NEEDS_CLARIFICATION");
  }

  if (nextConversationalCandidate(plan)) {
    throw new Error("GOAL_PLAN_EXPLICIT_CHOICE_REQUIRED");
  }

  return goalPlanDraftSchema.parse({
    ...plan,
    participantConfirmed: true,
    status: "confirmed",
  });
}
