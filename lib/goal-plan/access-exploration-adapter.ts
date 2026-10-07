import {
  GOAL_ACCESS_REQUIREMENT_TOKENS,
  type GoalAccessRequirementToken,
  type GoalPlanDraft,
} from "@mapable/contracts";

import type { AccessRequirementProfile } from "@/lib/access/experience/types";

const KNOWN_ACCESS_REQUIREMENTS = new Set<string>(
  GOAL_ACCESS_REQUIREMENT_TOKENS,
);

function isGoalAccessRequirementToken(
  value: string,
): value is GoalAccessRequirementToken {
  return KNOWN_ACCESS_REQUIREMENTS.has(value);
}

const ACCESS_REQUIREMENT_PATCHES: Record<
  GoalAccessRequirementToken,
  Partial<AccessRequirementProfile>
> = {
  step_free: { stepFreeRequired: true },
  accessible_toilet: { accessibleToiletRequired: true },
  lift: { liftRequired: true },
  hearing_loop: { hearingLoopNeeded: true },
  quiet_space: { quietAreaPreferred: true },
  accessible_parking: { accessibleParkingNeeded: true },
  drop_off: { dropOffNeeded: true },
  aac_friendly: { AACFriendlyNeeded: true },
  auslan: { AuslanNeeded: true },
  captioning: { captioningPreferred: true },
  assistance_animal: { assistanceAnimal: true },
  low_stimulus: { lowStimulusPreferred: true },
  changing_places: { changingPlacesPreferred: true },
  text_communication: { textCommunicationPreferred: true },
};

export function goalPlanAccessRequirementTokens(
  plan: GoalPlanDraft,
): GoalAccessRequirementToken[] {
  const accessCandidate = plan.serviceCandidates.find(
    (candidate) => candidate.module === "access",
  );
  if (!accessCandidate || accessCandidate.decision !== "yes") return [];

  const values = [
    ...plan.accessibilityRequirements,
    ...accessCandidate.requirements,
  ];

  return Array.from(
    new Set(values.filter(isGoalAccessRequirementToken)),
  );
}

/**
 * Produces a journey-only Access profile.
 *
 * Existing participant requirements are copied first. Goal-derived tokens may
 * only add explicit functional requirements; they never clear or weaken an
 * existing requirement and never infer wheelchair/powerchair use.
 */
export function buildGoalPlanAccessJourneyOverride(input: {
  plan: GoalPlanDraft;
  baseRequirements: AccessRequirementProfile;
}): AccessRequirementProfile | null {
  const tokens = goalPlanAccessRequirementTokens(input.plan);
  if (tokens.length === 0) return null;

  const next: AccessRequirementProfile = {
    ...input.baseRequirements,
  };

  for (const token of tokens) {
    Object.assign(next, ACCESS_REQUIREMENT_PATCHES[token]);
  }

  return next;
}
