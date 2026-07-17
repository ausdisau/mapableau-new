import type { MissionMaturityState } from "./maturity";
import type { AiProhibitedAction } from "./participant-rights";
import type { MissionVerticalKey } from "./verticals";

/**
 * Stable Mission Pack template contract — no Prisma persistence in Wave 1.
 * Domain records remain canonical; templates describe required capabilities only.
 */
export type MissionTemplateContract = {
  key: string;
  vertical: MissionVerticalKey;
  version: string;
  maturity: MissionMaturityState;
  requiredCapabilities: string[];
  prohibitedActions: AiProhibitedAction[];
  accessibilityContract: {
    requiresListAlternativeToMaps: true;
    allowsSmartphoneOnlyPathway: false;
    requiresHumanHelpPath: true;
  };
};

export const AT_CONTINUITY_PILOT_TEMPLATE: MissionTemplateContract = {
  key: "at_continuity.powered_mobility_before_work",
  vertical: "at_continuity",
  version: "0.1.0",
  maturity: "concept",
  requiredCapabilities: [
    "equipment.passport",
    "equipment.maintenance",
    "equipment.repair",
    "equipment.temporary",
    "continuity.impact",
    "mission.outcome_receipt",
  ],
  prohibitedActions: [
    "prescribe_equipment",
    "clinical_treatment",
    "approve_claims",
    "approve_payments",
  ],
  accessibilityContract: {
    requiresListAlternativeToMaps: true,
    allowsSmartphoneOnlyPathway: false,
    requiresHumanHelpPath: true,
  },
};

/** Dependency reference — points at canonical domain records; never copies them. */
export type MissionDependencyRef = {
  sourceDomain:
    | "care"
    | "transport"
    | "billing"
    | "consent"
    | "accessibility"
    | "access_evidence"
    | "equipment"
    | "continuity"
    | "case"
    | "starting_work"
    | "other";
  sourceRecordId: string;
  dependencyType: string;
  requiredState: string;
  currentState: string;
  hardOrOptional: "hard" | "optional";
  freshness: "current" | "stale" | "unknown";
  failureEffect: string;
};
