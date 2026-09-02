import { accessNeedToRequirementProfile } from "@/lib/access/experience/requirement-profile";
import type { AccessRequirementProfile } from "@/lib/access/experience/types";
import { calculateAccessFit } from "@/lib/access/fit/calculate-access-fit";
import type { AccessNeed, PlaceAccessProfile } from "@/lib/access/fit/types";

import {
  buildEvidenceSummary,
  REQUIREMENT_CHECKS,
  type AccessFitResultV2,
  type RequirementFit,
} from "./access-fit-v2-types";

export function calculateAccessFitV2(
  requirements: AccessRequirementProfile,
  placeProfile: PlaceAccessProfile,
): AccessFitResultV2 {
  const fits: RequirementFit[] = [];

  for (const check of REQUIREMENT_CHECKS) {
    if (!check.isSelected(requirements)) continue;
    const result = check.evaluate(requirements, placeProfile);
    fits.push({
      requirementId: check.id,
      label: check.label,
      state: result.state,
      evidenceRefs: result.evidenceRefs,
      explanation: result.explanation,
    });
  }

  const metCount = fits.filter((f) => f.state === "MEETS").length;
  const unmetCount = fits.filter((f) => f.state === "DOES_NOT_MATCH").length;
  const unknownCount = fits.filter((f) => f.state === "UNKNOWN").length;

  const legacyNeeds: AccessNeed = {
    wheelchairUser: requirements.wheelchairUser,
    powerchairUser: requirements.powerchairUser,
    stepFreeRequired: requirements.stepFreeRequired,
    accessibleToiletRequired: requirements.accessibleToiletRequired,
    lowSensoryNeeded: requirements.lowSensoryNeeded,
    hearingLoopNeeded: requirements.hearingLoopNeeded,
    AuslanNeeded: requirements.AuslanNeeded,
    AACFriendlyNeeded: requirements.AACFriendlyNeeded,
    assistanceAnimal: requirements.assistanceAnimal,
    accessibleParkingNeeded: requirements.accessibleParkingNeeded,
    dropOffNeeded: requirements.dropOffNeeded,
    transportSupportNeeded: requirements.transportSupportNeeded,
    fatigueBufferNeeded: requirements.fatigueBufferNeeded,
  };

  const legacy = calculateAccessFit(legacyNeeds, placeProfile);

  return {
    requirements: fits,
    metCount,
    unmetCount,
    unknownCount,
    selectedCount: fits.length,
    evidenceSummary: buildEvidenceSummary(fits, placeProfile),
    legacyScore: legacy.score,
  };
}

export function accessFitV2SummaryLine(result: AccessFitResultV2): string {
  if (result.selectedCount === 0) {
    return "Select access requirements to see how this place fits your needs.";
  }
  return `${result.metCount} of your ${result.selectedCount} selected requirements have supporting evidence`;
}

/** Filter places when unknownHandling avoids unknown-heavy fits. */
export function shouldIncludePlaceForUnknownHandling(
  result: AccessFitResultV2,
  unknownHandling: "SHOW" | "WARN" | "AVOID_WHEN_POSSIBLE",
): boolean {
  if (unknownHandling !== "AVOID_WHEN_POSSIBLE") return true;
  if (result.selectedCount === 0) return true;
  if (result.unmetCount > 0) return false;
  const unknownRatio = result.unknownCount / result.selectedCount;
  return unknownRatio < 0.5;
}

export function requirementProfileFromSession(
  raw: unknown,
): AccessRequirementProfile | null {
  if (!raw || typeof raw !== "object") return null;
  return accessNeedToRequirementProfile(raw as AccessNeed);
}
