import { buildJourneyFailureGraph } from "../journey/failure-graph";
import type { AccessQueryAst } from "../query/ast";
import type { AccessConclusionState } from "../results/states";

import type {
  AccessCounterfactualAlternative,
  AccessCounterfactualResult,
  AccessCounterfactualScenario,
} from "./types";

const SCENARIO_LABELS: Record<AccessCounterfactualScenario, string> = {
  lift_failure: "Lift failure",
  entrance_closure: "Entrance closure",
  worker_cancellation: "Support worker cancellation",
  transport_delay: "Accessible transport delay",
  inaccessible_replacement: "Inaccessible replacement vehicle",
  equipment_breakdown: "Assistive equipment breakdown",
  weather_change: "Weather-sensitive route change",
  event_layout_change: "Event layout change",
  after_hours_arrival: "After-hours arrival",
  toilet_closure: "Accessible toilet closure",
  crowd_obstruction: "Crowd obstruction",
  power_outage: "Power outage affecting automatic doors/lifts",
};

function alternativesFor(
  scenario: AccessCounterfactualScenario,
): AccessCounterfactualAlternative[] {
  switch (scenario) {
    case "lift_failure":
      return [
        {
          id: "alt-staff-entrance",
          label: "Staff-dependent entrance + stairs",
          valid: false,
          reason: "Fails step_free hard requirement; staff-only entrance avoided by query",
          additionalDistanceMetres: 40,
          additionalTimeMinutes: 10,
          additionalBurdenSummary: "Requires staff coordination and stair negotiation",
          addedDisclosure: true,
          humanAssistanceRequired: true,
        },
        {
          id: "alt-reschedule",
          label: "Reschedule appointment until Lift A confirmed",
          valid: true,
          reason: "Preserves hard requirements; no unverified step-free route claimed",
          additionalDistanceMetres: 0,
          additionalTimeMinutes: null,
          additionalBurdenSummary: "Confirmation call + possible wait",
          addedDisclosure: false,
          humanAssistanceRequired: false,
        },
        {
          id: "alt-remote",
          label: "Remote participation alternative",
          valid: true,
          reason: "Valid when destination offers remote option (unknown in fixture)",
          additionalDistanceMetres: 0,
          additionalTimeMinutes: 0,
          additionalBurdenSummary: "May require additional disclosure of access needs",
          addedDisclosure: true,
          humanAssistanceRequired: false,
        },
      ];
    case "entrance_closure":
      return [
        {
          id: "alt-west-closed",
          label: "Use staff entrance",
          valid: false,
          reason: "Avoided by participant query; assistance-only entrance",
          additionalDistanceMetres: 80,
          additionalTimeMinutes: 15,
          additionalBurdenSummary: "Staff dependency + disclosure",
          addedDisclosure: true,
          humanAssistanceRequired: true,
        },
        {
          id: "alt-confirm-other",
          label: "Confirm alternate step-free public entrance",
          valid: true,
          reason: "Valid only after venue confirmation of clear width and step-free path",
          additionalDistanceMetres: null,
          additionalTimeMinutes: null,
          additionalBurdenSummary: "Venue confirmation required",
          addedDisclosure: false,
          humanAssistanceRequired: false,
        },
      ];
    case "inaccessible_replacement":
      return [
        {
          id: "alt-accept-unknown-hoist",
          label: "Accept replacement with unknown hoist compatibility",
          valid: false,
          reason: "Hard requirement remains unknown — not a valid recovery",
          additionalDistanceMetres: null,
          additionalTimeMinutes: null,
          additionalBurdenSummary: "False recovery risk",
          addedDisclosure: true,
          humanAssistanceRequired: true,
        },
        {
          id: "alt-hold-case",
          label: "Keep Continuity case open until hoist confirmed",
          valid: true,
          reason: "Preserves unknown hard requirement; no restored status",
          additionalDistanceMetres: 0,
          additionalTimeMinutes: null,
          additionalBurdenSummary: "Waiting + confirmation steps attributed to provider",
          addedDisclosure: false,
          humanAssistanceRequired: false,
        },
      ];
    default:
      return [
        {
          id: "alt-confirm",
          label: "Request confirmation before travel",
          valid: true,
          reason: "Preserves hard requirements under uncertainty",
          additionalDistanceMetres: null,
          additionalTimeMinutes: null,
          additionalBurdenSummary: "Confirmation burden attributed to missing operational feeds",
          addedDisclosure: false,
          humanAssistanceRequired: false,
        },
        {
          id: "alt-unverified-detour",
          label: "Unverified temporary detour",
          valid: false,
          reason: "Fallback unverified — cannot treat as compatible",
          additionalDistanceMetres: 600,
          additionalTimeMinutes: 20,
          additionalBurdenSummary: "Extra distance and uncertainty",
          addedDisclosure: false,
          humanAssistanceRequired: false,
        },
      ];
  }
}

function simulatedConclusion(
  scenario: AccessCounterfactualScenario,
  baseline: AccessConclusionState,
): AccessConclusionState {
  switch (scenario) {
    case "lift_failure":
    case "entrance_closure":
    case "power_outage":
      return "blocked_by_hard_requirement";
    case "inaccessible_replacement":
      return "fallback_unverified";
    case "toilet_closure":
      return "temporarily_unavailable";
    case "transport_delay":
    case "worker_cancellation":
      return "requires_human_assistance";
    default:
      return baseline === "compatible" ? "cannot_confirm" : baseline;
  }
}

/**
 * Counterfactual simulation over Harbour journey preflight.
 * Performs no external actions, bookings, or Continuity writes.
 */
export function runAccessCounterfactual(input: {
  query: AccessQueryAst;
  requirementSetRef: string;
  scenario: AccessCounterfactualScenario;
}): AccessCounterfactualResult {
  const failure = buildJourneyFailureGraph({
    query: input.query,
    requirementSetRef: input.requirementSetRef,
  });

  const alts = alternativesFor(input.scenario);
  const validAlternatives = alts.filter((a) => a.valid);
  const invalidAlternatives = alts.filter((a) => !a.valid);
  const simulated = simulatedConclusion(input.scenario, failure.overallConclusion);

  const affected =
    input.scenario === "lift_failure"
      ? failure.nodes
          .filter((n) => n.assetId === "harbour_civic.lift_a" || /lift|level 3|corridor|room/i.test(n.label))
          .map((n) => n.label)
      : input.scenario === "entrance_closure"
        ? failure.nodes.filter((n) => /entrance/i.test(n.label)).map((n) => n.label)
        : failure.singlePointsOfFailure;

  const extraTime = validAlternatives.reduce(
    (max, a) => Math.max(max, a.additionalTimeMinutes ?? 0),
    0,
  );

  return {
    resultId: `cf:${input.query.id}:${input.scenario}`,
    scenario: input.scenario,
    queryId: input.query.id,
    destinationRef: failure.destinationRef,
    baselineConclusion: failure.overallConclusion,
    simulatedConclusion: simulated,
    goalImpact: `${SCENARIO_LABELS[input.scenario]} changes journey conclusion from ${failure.overallConclusion} to ${simulated}`,
    affectedDependencies: affected.length > 0 ? affected : failure.hardDependencies.slice(0, 3),
    validAlternatives,
    invalidAlternatives,
    additionalCostSummary: null,
    additionalTimeMinutes: extraTime || null,
    additionalBurdenSummary:
      validAlternatives[0]?.additionalBurdenSummary ??
      "Additional confirmation burden under simulated failure",
    addedDisclosure: alts.some((a) => a.addedDisclosure && a.valid),
    humanAssistance:
      simulated === "requires_human_assistance"
        ? "Human assistance or Continuity recovery proposal may be required (not executed)"
        : null,
    unresolvedUnknowns: [
      ...failure.authorityGaps.map((g) => `Authority gap: ${g}`),
      "Simulation does not confirm live operational state",
    ],
    externalActionsExecuted: false,
    limitations: [
      "Counterfactual simulation performs no external action",
      "A replacement proposed is not a recovery completed",
      "Invalid alternatives that fail hard requirements are excluded from optimisation",
      ...failure.limitations.slice(0, 2),
    ],
    listAlternative: alts.map((a) => ({
      id: a.id,
      label: a.label,
      valid: a.valid,
      reason: a.reason,
    })),
    operatingMode: "synthetic",
    productionClaim: "none",
  };
}

export function listCounterfactualScenarios(): AccessCounterfactualScenario[] {
  return Object.keys(SCENARIO_LABELS) as AccessCounterfactualScenario[];
}
