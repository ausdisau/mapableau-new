import type {
  AccessFitLevel,
  AccessFitMatchDetail,
  AccessFitResult,
  AccessNeedId,
  AccessNeedProfile,
} from "@/types/wedges";
import { ACCESS_NEED_LABELS } from "@/types/wedges";

export type { AccessFitLevel, AccessFitResult };

const NEED_TO_CAPABILITY: Partial<Record<AccessNeedId, AccessNeedId[]>> = {
  wheelchairAccess: ["wheelchairAccess", "stepFreeEntry"],
  powerchairAccess: ["powerchairAccess", "wheelchairAccess", "stepFreeEntry"],
  stepFreeEntry: ["stepFreeEntry"],
  accessibleToilet: ["accessibleToilet"],
  lowSensoryEnvironment: ["lowSensoryEnvironment"],
  auslan: ["auslan"],
  aacFriendly: ["aacFriendly"],
  plainLanguage: ["plainLanguage"],
  homeVisit: ["homeVisit"],
  telehealth: ["telehealth"],
  hoistReady: ["hoistReady"],
  assistanceAnimalFriendly: ["assistanceAnimalFriendly"],
  transportSupportNeeded: ["transportSupportNeeded", "homeVisit"],
};

function scoreToLevel(score: number, hasHardBarrier: boolean): AccessFitLevel {
  if (hasHardBarrier) return "likely_barrier";
  if (score >= 80) return "strong_fit";
  if (score >= 55) return "possible_fit";
  if (score >= 30) return "needs_confirmation";
  return "likely_barrier";
}

function questionForNeed(needId: AccessNeedId): string {
  const label = ACCESS_NEED_LABELS[needId];
  return `Can you confirm whether your service supports: ${label}?`;
}

/**
 * Calculate access-fit score between participant needs and provider capabilities.
 * Returns 0–100 score with explanations. Does not guarantee suitability.
 */
export function accessFitScore(
  participantNeeds: AccessNeedProfile,
  providerCapabilities: Partial<Record<AccessNeedId, boolean | null>>,
): AccessFitResult {
  const activeNeeds = (Object.entries(participantNeeds) as [AccessNeedId, boolean | string][])
    .filter(([, v]) => v === true || (typeof v === "string" && v.length > 0))
    .map(([k]) => k);

  if (activeNeeds.length === 0) {
    return {
      score: 100,
      level: "strong_fit",
      hardBarriers: [],
      partialMatches: [],
      unknowns: [],
      details: [],
      recommendedQuestions: [],
    };
  }

  const details: AccessFitMatchDetail[] = [];
  const hardBarriers: AccessNeedId[] = [];
  const partialMatches: AccessNeedId[] = [];
  const unknowns: AccessNeedId[] = [];
  let totalWeight = 0;
  let earnedScore = 0;

  for (const needId of activeNeeds) {
    const capKeys = NEED_TO_CAPABILITY[needId] ?? [needId];
    let status: AccessFitMatchDetail["status"] = "unknown";
    let explanation = `${ACCESS_NEED_LABELS[needId]}: not yet confirmed for this provider.`;

    for (const capKey of capKeys) {
      const cap = providerCapabilities[capKey];
      if (cap === true) {
        status = "match";
        explanation = `${ACCESS_NEED_LABELS[needId]}: provider indicates this is supported.`;
        break;
      }
      if (cap === false) {
        status = "barrier";
        explanation = `${ACCESS_NEED_LABELS[needId]}: provider indicates this may not be available.`;
        break;
      }
    }

    if (status === "unknown") {
      // Check if any related cap is partial (only primary key false but alt true handled above)
      const primary = providerCapabilities[needId];
      if (primary === null || primary === undefined) {
        unknowns.push(needId);
      }
    }

    details.push({ needId, status, explanation });

    totalWeight += 1;
    switch (status) {
      case "match":
        earnedScore += 1;
        break;
      case "barrier":
        hardBarriers.push(needId);
        earnedScore += 0;
        break;
      case "unknown":
        unknowns.push(needId);
        earnedScore += 0.25;
        break;
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  const score = totalWeight > 0 ? Math.round((earnedScore / totalWeight) * 100) : 100;
  const level = scoreToLevel(score, hardBarriers.length > 0);

  const recommendedQuestions = [
    ...new Set([...unknowns, ...partialMatches].map(questionForNeed)),
  ];

  return {
    score,
    level,
    hardBarriers: [...new Set(hardBarriers)],
    partialMatches: [...new Set(partialMatches)],
    unknowns: [...new Set(unknowns)],
    details,
    recommendedQuestions,
  };
}

export function accessFitLevelLabel(level: AccessFitLevel): string {
  switch (level) {
    case "strong_fit":
      return "Strong fit";
    case "possible_fit":
      return "Possible fit";
    case "needs_confirmation":
      return "Needs confirmation";
    case "likely_barrier":
      return "Likely barrier";
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}
