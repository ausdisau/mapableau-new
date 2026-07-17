import type { AccessConclusionState } from "../results/states";

export type AccessCounterfactualScenario =
  | "lift_failure"
  | "entrance_closure"
  | "worker_cancellation"
  | "transport_delay"
  | "inaccessible_replacement"
  | "equipment_breakdown"
  | "weather_change"
  | "event_layout_change"
  | "after_hours_arrival"
  | "toilet_closure"
  | "crowd_obstruction"
  | "power_outage";

export type AccessCounterfactualAlternative = {
  id: string;
  label: string;
  valid: boolean;
  reason: string;
  additionalDistanceMetres: number | null;
  additionalTimeMinutes: number | null;
  additionalBurdenSummary: string | null;
  addedDisclosure: boolean;
  humanAssistanceRequired: boolean;
};

export type AccessCounterfactualResult = {
  resultId: string;
  scenario: AccessCounterfactualScenario;
  queryId: string;
  destinationRef: string;
  baselineConclusion: AccessConclusionState;
  simulatedConclusion: AccessConclusionState;
  goalImpact: string;
  affectedDependencies: string[];
  validAlternatives: AccessCounterfactualAlternative[];
  invalidAlternatives: AccessCounterfactualAlternative[];
  additionalCostSummary: string | null;
  additionalTimeMinutes: number | null;
  additionalBurdenSummary: string;
  addedDisclosure: boolean;
  humanAssistance: string | null;
  unresolvedUnknowns: string[];
  /** Simulation performs no external action. */
  externalActionsExecuted: false;
  limitations: string[];
  listAlternative: Array<{
    id: string;
    label: string;
    valid: boolean;
    reason: string;
  }>;
  operatingMode: "synthetic" | "shadow";
  productionClaim: "none";
};
