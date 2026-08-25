import type { CapabilityState } from "../contracts/state";
import type {
  HomeRoutine,
  HomeRoutineEvaluation,
  HomeRoutineId,
  HomeRoutineOutcome,
} from "../contracts/routine";

export const HOME_ROUTINES: HomeRoutine[] = [
  {
    id: "GOING_OUT",
    displayName: "Going out",
    description:
      "Check hallway lighting, front door, wheelchair charger and building lift before leaving.",
    steps: [
      {
        id: "going-out-hall-light",
        capabilityKind: "TURN_ON",
        endpointId: "sim-hall-light",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "going-out-door",
        capabilityKind: "READ_STATE",
        endpointId: "sim-front-door",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "going-out-lock",
        capabilityKind: "LOCK",
        endpointId: "sim-front-lock",
        requiresConfirmation: true,
        preAuthorisable: false,
      },
      {
        id: "going-out-charger",
        capabilityKind: "REPORT_CHARGING",
        endpointId: "sim-wheelchair-charger",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "going-out-lift",
        capabilityKind: "REPORT_AVAILABILITY",
        endpointId: "sim-building-lift",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
    ],
  },
  {
    id: "COMING_HOME",
    displayName: "Coming home",
    description: "Prepare entry lighting and check front door state on arrival.",
    steps: [
      {
        id: "coming-home-hall-light",
        capabilityKind: "TURN_ON",
        endpointId: "sim-hall-light",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "coming-home-unlock",
        capabilityKind: "UNLOCK",
        endpointId: "sim-front-lock",
        requiresConfirmation: true,
        preAuthorisable: false,
      },
      {
        id: "coming-home-living-light",
        capabilityKind: "TURN_ON",
        endpointId: "sim-living-light",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
    ],
  },
  {
    id: "SUPPORT_WORKER_ARRIVING",
    displayName: "Support worker arriving",
    description:
      "Notify arrival and prepare shared living space within delegated permissions.",
    steps: [
      {
        id: "sw-notify",
        capabilityKind: "NOTIFY",
        endpointId: "sim-intercom",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "sw-internal-light",
        capabilityKind: "TURN_ON",
        endpointId: "sim-living-light",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "sw-blinds",
        capabilityKind: "SET_COVERING_POSITION",
        endpointId: "sim-living-blinds",
        parameters: { position: 80 },
        requiresConfirmation: false,
        preAuthorisable: true,
      },
    ],
  },
  {
    id: "GOING_TO_BED",
    displayName: "Going to bed",
    description: "Dim living lights, close blinds, prepare bedroom lighting.",
    steps: [
      {
        id: "bed-living-off",
        capabilityKind: "TURN_OFF",
        endpointId: "sim-living-light",
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "bed-blinds",
        capabilityKind: "SET_COVERING_POSITION",
        endpointId: "sim-living-blinds",
        parameters: { position: 0 },
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "bed-bedroom-light",
        capabilityKind: "SET_LEVEL",
        endpointId: "sim-bedroom-light",
        parameters: { level: 20 },
        requiresConfirmation: false,
        preAuthorisable: true,
      },
      {
        id: "bed-adjust",
        capabilityKind: "SET_POSITION",
        endpointId: "sim-adjustable-bed",
        parameters: { position: 30 },
        requiresConfirmation: true,
        preAuthorisable: false,
      },
    ],
  },
];

export function getHomeRoutine(id: HomeRoutineId): HomeRoutine | undefined {
  return HOME_ROUTINES.find((r) => r.id === id);
}

export function listHomeRoutines(): HomeRoutine[] {
  return HOME_ROUTINES;
}

/**
 * Deterministic routine evaluation.
 * Unknown lift/charger state must not become "available".
 */
export function evaluateHomeRoutine(
  routineId: HomeRoutineId,
  getState: (endpointId: string, capabilityId: string) => CapabilityState,
): HomeRoutineEvaluation {
  const routine = getHomeRoutine(routineId);
  if (!routine) {
    return {
      routineId,
      outcome: "BLOCKED_BY_UNAVAILABLE_CAPABILITY",
      checkedAt: new Date().toISOString(),
      steps: [],
      explanation: `Unknown routine ${routineId}.`,
    };
  }

  const steps: HomeRoutineEvaluation["steps"] = [];
  let outcome: HomeRoutineOutcome = "READY";

  for (const step of routine.steps) {
    const state = getState(step.endpointId, step.capabilityKind);

    if (state.confidence === "UNAVAILABLE") {
      steps.push({
        stepId: step.id,
        endpointId: step.endpointId,
        status: "UNAVAILABLE",
        detail: state.explanation ?? "Capability unavailable.",
      });
      outcome = "BLOCKED_BY_UNAVAILABLE_CAPABILITY";
      continue;
    }

    if (state.confidence === "UNKNOWN") {
      steps.push({
        stepId: step.id,
        endpointId: step.endpointId,
        status: "UNKNOWN",
        detail:
          state.explanation ??
          "State is unknown; MapAble will not treat this as available.",
      });
      if (outcome === "READY" || outcome === "NEEDS_CONFIRMATION") {
        outcome = "HAS_UNKNOWN_STATE";
      }
      continue;
    }

    if (step.requiresConfirmation) {
      steps.push({
        stepId: step.id,
        endpointId: step.endpointId,
        status: "NEEDS_CONFIRMATION",
        detail: "This step needs your confirmation before it can run.",
      });
      if (outcome === "READY") outcome = "NEEDS_CONFIRMATION";
      continue;
    }

    steps.push({
      stepId: step.id,
      endpointId: step.endpointId,
      status: "OK",
      detail: "Known state; step can proceed under MapAble authority.",
    });
  }

  const explanation =
    outcome === "READY"
      ? `${routine.displayName} is ready under current known state.`
      : outcome === "NEEDS_CONFIRMATION"
        ? `${routine.displayName} needs confirmation for one or more steps.`
        : outcome === "HAS_UNKNOWN_STATE"
          ? `${routine.displayName} has unknown state; MapAble will not invent availability.`
          : `${routine.displayName} is blocked by an unavailable capability.`;

  return {
    routineId,
    outcome,
    checkedAt: new Date().toISOString(),
    steps,
    explanation,
  };
}
