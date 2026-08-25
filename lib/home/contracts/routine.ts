import type { HomeCapabilityKind } from "./capability";

export type HomeRoutineId =
  | "GOING_OUT"
  | "COMING_HOME"
  | "SUPPORT_WORKER_ARRIVING"
  | "GOING_TO_BED";

export type HomeRoutineStep = {
  id: string;
  capabilityKind: HomeCapabilityKind;
  endpointId: string;
  parameters?: Record<string, unknown>;
  requiresConfirmation: boolean;
  preAuthorisable: boolean;
};

export type HomeRoutine = {
  id: HomeRoutineId;
  displayName: string;
  description: string;
  steps: HomeRoutineStep[];
};

export type HomeRoutineOutcome =
  | "READY"
  | "NEEDS_CONFIRMATION"
  | "HAS_UNKNOWN_STATE"
  | "BLOCKED_BY_UNAVAILABLE_CAPABILITY";

export type HomeRoutineEvaluation = {
  routineId: HomeRoutineId;
  outcome: HomeRoutineOutcome;
  checkedAt: string;
  steps: Array<{
    stepId: string;
    endpointId: string;
    status: "OK" | "NEEDS_CONFIRMATION" | "UNKNOWN" | "UNAVAILABLE" | "BLOCKED";
    detail: string;
  }>;
  explanation: string;
};
