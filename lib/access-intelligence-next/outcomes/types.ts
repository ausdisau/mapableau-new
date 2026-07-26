import type { AccessConclusionState } from "../results/states";

/**
 * Real-world outcome states — distinct from route-found / request-created / service-confirmed.
 */
export type AccessOutcomeState =
  | "not_started"
  | "preflight_completed"
  | "journey_in_progress"
  | "service_requested"
  | "service_confirmed"
  | "service_delivered"
  | "participant_goal_achieved"
  | "participant_goal_not_achieved"
  | "participant_goal_not_yet_verified"
  | "abandoned"
  | "recovery_in_progress"
  | "recovery_completed";

export type AccessOutcomeRecord = {
  outcomeId: string;
  journeyRef: string;
  queryId: string;
  destinationRef: string;
  preflightConclusion: AccessConclusionState;
  outcomeState: AccessOutcomeState;
  /** Explicit ladder — these are not equivalent. */
  distinctions: {
    routeFound: boolean;
    requestCreated: boolean;
    serviceConfirmed: boolean;
    participantGoalAchieved: boolean;
  };
  evidenceSummary: string;
  limitations: string[];
  recordedAt: string;
  operatingMode: "synthetic" | "shadow";
  productionClaim: "none";
};
