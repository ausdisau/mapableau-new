export type GoalServiceModule = "jobs" | "access" | "transport" | "care";

export type GoalServiceDecision = "undecided" | "yes" | "no" | "not_sure";

export type GoalServiceChoice = Exclude<GoalServiceDecision, "undecided">;

export interface GoalServiceCandidate {
  module: GoalServiceModule;
  label: string;
  reason: string;
  question: string;
  decision: GoalServiceDecision;
  allowedDecisions: readonly ["yes", "no", "not_sure"];
  requiresExplicitChoice: boolean;
}

export interface GoalPlanDraft {
  originalGoal: string;
  needsClarification: boolean;
  clarificationPrompt: string | null;
  serviceCandidates: GoalServiceCandidate[];
  disclosurePermissions: string[];
}

type CandidateDefinition = Omit<
  GoalServiceCandidate,
  "decision" | "allowedDecisions"
> & {
  matches: RegExp[];
};

const ALLOWED_DECISIONS = ["yes", "no", "not_sure"] as const;

const CANDIDATE_DEFINITIONS: CandidateDefinition[] = [
  {
    module: "jobs",
    label: "Jobs",
    reason: "Your goal mentions work, employment or a workplace outcome.",
    question:
      "Jobs may help with this goal. Would you like me to include employment options in your plan?",
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
    label: "Access",
    reason: "Your goal includes an accessibility feature or access requirement.",
    question:
      "Access may help check whether places fit your requirements. Would you like me to include it?",
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
    label: "Transport",
    reason: "Your goal mentions travel, a journey or getting somewhere.",
    question:
      "Transport may help you get there. Would you like me to include accessible travel options?",
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
    label: "Care",
    reason: "You explicitly mentioned personal or support-worker assistance.",
    question:
      "Personal support may help with the support you mentioned. Would you like me to include Care?",
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

function matchesAny(goal: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(goal));
}

function toCandidate(definition: CandidateDefinition): GoalServiceCandidate {
  const { matches: _matches, ...candidate } = definition;

  return {
    ...candidate,
    decision: "undecided",
    allowedDecisions: ALLOWED_DECISIONS,
  };
}

export function buildGoalPlanDraft(goal: string): GoalPlanDraft {
  const originalGoal = goal.trim();

  if (!originalGoal) {
    return {
      originalGoal,
      needsClarification: true,
      clarificationPrompt: "What would you like to achieve? You can describe a goal in your own words.",
      serviceCandidates: [],
      disclosurePermissions: [],
    };
  }

  const serviceCandidates = CANDIDATE_DEFINITIONS.filter((definition) =>
    matchesAny(originalGoal, definition.matches),
  ).map(toCandidate);

  return {
    originalGoal,
    needsClarification: serviceCandidates.length === 0,
    clarificationPrompt:
      serviceCandidates.length === 0
        ? "I understand the goal, but I am not yet sure which MapAble services fit. What part would you like help with first?"
        : null,
    serviceCandidates,
    disclosurePermissions: [],
  };
}
