import { randomUUID } from "crypto";

import { mapableHomeFlags } from "@/lib/config/mapable-home";
import { createSimulatorHomeAdapter } from "@/lib/home/adapters/simulator/simulator-adapter";
import { HomeActionBroker } from "@/lib/home/core/action-broker";
import { listHomeCapabilities } from "@/lib/home/core/capability-registry";
import {
  evaluateHomeRoutine,
  listHomeRoutines,
} from "@/lib/home/core/routine-engine";
import type { HomeActionRequest } from "@/lib/home/contracts/action";
import type {
  HomeAutonomyLevel,
  HomeCapabilityKind,
} from "@/lib/home/contracts/capability";
import type { HomeRoutineId } from "@/lib/home/contracts/routine";
import type { AuthorityEvaluatorContext } from "@/lib/home/core/authority-evaluator";

let simulator = createSimulatorHomeAdapter();
let broker = new HomeActionBroker(
  new Map([[simulator.id, simulator]]),
  () => simulator.id,
);

export function resetHomeSimulatorRuntime(): void {
  simulator = createSimulatorHomeAdapter();
  broker = new HomeActionBroker(
    new Map([[simulator.id, simulator]]),
    () => simulator.id,
  );
}

export function getHomeSimulator() {
  return simulator;
}

export function getHomeActionBroker() {
  return broker;
}

export class HomeServiceError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HomeServiceError";
  }
}

export function assertHomeSimulatorEnabled(): void {
  if (!mapableHomeFlags.enabled || !mapableHomeFlags.simulatorEnabled) {
    throw new HomeServiceError(
      "MapAble Home simulator is not enabled.",
      "FEATURE_DISABLED",
      404,
    );
  }
}

export async function getHomeEnvironmentSnapshot() {
  assertHomeSimulatorEnabled();
  const environment = simulator.getEnvironment();
  const endpoints = await simulator.discover();
  return {
    environment,
    endpoints,
    capabilities: listHomeCapabilities(),
  };
}

export async function getHomeEndpointState(
  endpointId: string,
  capabilityId: string,
) {
  assertHomeSimulatorEnabled();
  return simulator.getState(endpointId, capabilityId);
}

export function listSimulatorRoutines() {
  assertHomeSimulatorEnabled();
  return listHomeRoutines();
}

export async function evaluateRoutineForSimulator(routineId: HomeRoutineId) {
  assertHomeSimulatorEnabled();
  return evaluateHomeRoutine(routineId, (endpointId, capabilityKind) => {
    const raw = simulator.getRawState(endpointId, capabilityKind);
    if (raw) return raw;
    return {
      endpointId,
      capabilityId: capabilityKind,
      value: null,
      confidence: "UNKNOWN" as const,
      observedAt: null,
      explanation: "No observed state for this capability.",
    };
  });
}

export async function proposeHomeAction(input: {
  participantId: string;
  actorId: string;
  endpointId: string;
  capabilityKind: HomeCapabilityKind;
  parameters?: Record<string, unknown>;
  confirmationToken?: string;
  delegationId?: string;
  vendorPermissionClaimed?: boolean;
  participantAutonomyCeiling?: HomeAutonomyLevel;
  preAuthorisedCapabilityKinds?: HomeCapabilityKind[];
  participantRefused?: boolean;
}) {
  assertHomeSimulatorEnabled();

  const request: HomeActionRequest = {
    id: randomUUID(),
    correlationId: randomUUID(),
    participantId: input.participantId,
    actorId: input.actorId,
    endpointId: input.endpointId,
    capabilityKind: input.capabilityKind,
    parameters: input.parameters,
    requestedAt: new Date().toISOString(),
    confirmationToken: input.confirmationToken,
    delegationId: input.delegationId,
    vendorPermissionClaimed: input.vendorPermissionClaimed,
  };

  const authorityCtx: Omit<AuthorityEvaluatorContext, "pendingConfirmations"> = {
    participantAutonomyCeiling:
      input.participantAutonomyCeiling ?? "H3_CONFIRM",
    preAuthorisedCapabilityKinds: input.preAuthorisedCapabilityKinds,
    participantRefused: input.participantRefused,
  };

  return broker.proposeAndMaybeExecute(request, authorityCtx);
}
