import {
  goalPlanDraftSchema,
  goalServiceCandidateSchema,
  type GoalPlanDraft,
  type GoalServiceCandidate,
  type GoalServiceModule,
  type ParticipantDecision,
} from "./goal-plan";

export const STEP_BY_STEP_PREFERENCE = "step_by_step_decisions" as const;

export type BuildGoalPlanOptions = {
  stepByStep?: boolean;
};

type CandidateDefinition = {
  module: GoalServiceModule;
  reasonSuggested: string;
  participantBenefit: string;
  question: string;
  confidence: GoalServiceCandidate["confidence"];
  sensitivity: GoalServiceCandidate["sensitivity"];
  requiresExplicitChoice: boolean;
  matches: RegExp[];
};

const CANDIDATE_DEFINITIONS: CandidateDefinition[] = [
  {
    module: "jobs",
    reasonSuggested:
      "Your goal mentions work, employment, a career or a workplace outcome.",
    participantBenefit:
      "Explore employment options that fit the outcome you described.",
    question:
      "Jobs may help with this goal. Would you like me to include Jobs in this Goal Plan?",
    confidence: "high",
    sensitivity: "ordinary",
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
      "Check places or services against the access requirements you choose to keep in the plan.",
    question:
      "Access may help check whether places fit your requirements. Would you like me to include Access in this Goal Plan?",
    confidence: "high",
    sensitivity: "ordinary",
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
      "Your goal mentions transport, travel, a journey or getting somewhere.",
    participantBenefit:
      "Explore travel options without treating a suggestion as a booking or approval.",
    question:
      "Transport may help you get there. Would you like me to include Transport in this Goal Plan?",
    confidence: "high",
    sensitivity: "ordinary",
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
      "You explicitly mentioned personal assistance or support-worker help relevant to this goal.",
    participantBenefit:
      "Explore personal support only if you choose to include it.",
    question:
      "You mentioned personal support. Would you like me to include Care in this Goal Plan?",
    confidence: "high",
    sensitivity: "sensitive",
    requiresExplicitChoice: true,
    matches: [
      /\bsupport worker\b/i,
      /\bcare worker\b/i,
      /\bsupport person\b/i,
      /\bpersonal care\b/i,
      /\bpersonal support\b/i,
      /\bhelp(?: me)? with (?:my )?(?:morning routine|self[- ]care|showering|dressing|meal preparation|meal prep)\b/i,
    ],
  },
];

function matchesAny(goal: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(goal));
}

function buildCandidate(
  definition: CandidateDefinition,
  options: BuildGoalPlanOptions,
): GoalServiceCandidate {
  const candidate = goalServiceCandidateSchema.parse({
    module: definition.module,
    reasonSuggested: definition.reasonSuggested,
    participantBenefit: definition.participantBenefit,
    question: definition.question,
    decision: "undecided",
    confidence: definition.confidence,
    sensitivity: definition.sensitivity,
    askConversationally:
      options.stepByStep === true ||
      definition.requiresExplicitChoice ||
      definition.sensitivity !== "ordinary",
    requiresExplicitChoice: definition.requiresExplicitChoice,
    requirements: [],
    nonNegotiables: [],
    uncertainties: [],
    dataRequired: [],
    proposedDisclosure: [],
  });

  return candidate;
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
  options: BuildGoalPlanOptions = {},
): GoalPlanDraft {
  const normalizedGoal = goal.trim();
  const preferences = options.stepByStep ? [STEP_BY_STEP_PREFERENCE] : [];

  if (!normalizedGoal) {
    return goalPlanDraftSchema.parse({
      goal: normalizedGoal,
      participantConfirmed: false,
      needsClarification: true,
      clarificationPrompt:
        "What would you like to achieve? You can describe a goal in your own words.",
      desiredOutcomes: [],
      preferences,
      nonNegotiables: [],
      accessibilityRequirements: [],
      communicationRequirements: [],
      exclusions: [],
      serviceCandidates: [],
      disclosurePermissions: [],
      uncertainties: ["No goal has been provided yet."],
      humanHelpRequested: false,
      status: "draft",
    });
  }

  const serviceCandidates = CANDIDATE_DEFINITIONS.filter((definition) =>
    matchesAny(normalizedGoal, definition.matches),
  ).map((definition) => buildCandidate(definition, options));

  const needsClarification = serviceCandidates.length === 0;

  return goalPlanDraftSchema.parse({
    goal: normalizedGoal,
    participantConfirmed: false,
    needsClarification,
    clarificationPrompt: needsClarification
      ? "I understand the goal, but I am not yet sure which MapAble services fit. What part would you like help with first?"
      : undefined,
    desiredOutcomes: [normalizedGoal],
    preferences,
    nonNegotiables: [],
    accessibilityRequirements: [],
    communicationRequirements: [],
    exclusions: [],
    serviceCandidates,
    disclosurePermissions: [],
    uncertainties: needsClarification
      ? ["No bounded MapAble service has been identified yet."]
      : [],
    humanHelpRequested: false,
    status: "draft",
  });
}

export function setGoalPlanDecision(
  plan: GoalPlanDraft,
  module: GoalServiceModule,
  decision: ParticipantDecision,
): GoalPlanDraft {
  const exists = plan.serviceCandidates.some(
    (candidate) => candidate.module === module,
  );
  if (!exists) {
    throw new Error("GOAL_PLAN_CANDIDATE_NOT_FOUND");
  }

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
