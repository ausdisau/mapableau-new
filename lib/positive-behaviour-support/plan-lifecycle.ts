import {
  evaluateFinalisationGates,
  assertDraftIsNotActivePlan,
} from "./invariants";
import type { PbsRpGateResult } from "./restrictive-practice-gate";
import {
  assertPbsPlanTransition,
  isPbsPlanVersionImmutable,
} from "./state-machine";
import type {
  PbsFinalisationChecklist,
  PbsPlanStatus,
  PbsPlanType,
} from "./types";

export interface PbsPlanLifecycleState {
  status: PbsPlanStatus;
  planType: PbsPlanType;
  versionNumber: number;
  finalisedAt: Date | null;
}

export function transitionPbsPlanStatus(
  current: PbsPlanLifecycleState,
  to: PbsPlanStatus,
): PbsPlanLifecycleState {
  assertPbsPlanTransition(current.status, to);
  return {
    ...current,
    status: to,
    finalisedAt:
      to === "finalised" ? current.finalisedAt ?? new Date() : current.finalisedAt,
  };
}

export function finalisePbsPlan(params: {
  current: PbsPlanLifecycleState;
  checklist: PbsFinalisationChecklist;
  finalisationFlagEnabled: boolean;
}): PbsPlanLifecycleState {
  if (!params.finalisationFlagEnabled) {
    throw new Error("PBS practitioner finalisation is disabled");
  }
  const gates = evaluateFinalisationGates(params.checklist);
  if (!gates.ok) {
    throw new Error(
      `Plan finalisation gates failed: ${gates.failures.join(", ")}`,
    );
  }
  return transitionPbsPlanStatus(params.current, "finalised");
}

export function activatePbsPlan(params: {
  current: PbsPlanLifecycleState;
  rpGate: PbsRpGateResult | null;
}): PbsPlanLifecycleState {
  if (params.current.status !== "finalised") {
    throw new Error("Only finalised plans may become active");
  }
  if (params.rpGate?.activationBlocked) {
    throw new Error(
      `Restrictive-practice authorisation gaps block activation: ${params.rpGate.failures.join(", ")}`,
    );
  }
  return transitionPbsPlanStatus(params.current, "active");
}

export function assertPlanVersionMutable(status: PbsPlanStatus): void {
  if (isPbsPlanVersionImmutable(status)) {
    throw new Error(
      "Finalised plan versions are immutable — create a new version or append-only correction",
    );
  }
}

export function assertNotClaimingDraftAsActive(status: PbsPlanStatus): void {
  assertDraftIsNotActivePlan(status, false);
}
