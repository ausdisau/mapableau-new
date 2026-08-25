import { randomUUID } from "crypto";

import type {
  AuthorizedHomeAction,
  HomeActionReceipt,
  HomeActionResultCode,
} from "../contracts/action";
import type { CapabilityState } from "../contracts/state";

export function buildHomeActionReceipt(input: {
  action: AuthorizedHomeAction;
  result: HomeActionResultCode;
  stateBefore: CapabilityState | null;
  stateAfter: CapabilityState | null;
  explanation: string;
  startedAt?: string;
  completedAt?: string;
  undoAvailable?: boolean;
}): HomeActionReceipt {
  const startedAt = input.startedAt ?? new Date().toISOString();
  const completedAt = input.completedAt ?? new Date().toISOString();
  return {
    id: randomUUID(),
    actionId: input.action.id,
    requestId: input.action.requestId,
    correlationId: input.action.correlationId,
    capabilityKind: input.action.capabilityKind,
    endpointId: input.action.endpointId,
    requestedBy: input.action.actorId,
    authorityBasis: input.action.authorityBasis,
    adapterId: input.action.adapterId,
    startedAt,
    completedAt,
    result: input.result,
    stateBefore: input.stateBefore,
    stateAfter: input.stateAfter,
    explanation: input.explanation,
    undoAvailable: input.undoAvailable ?? false,
  };
}

export function explainSimulatedAction(input: {
  capabilityKind: string;
  endpointDisplayName: string;
  routineName?: string;
  authorityBasis: string;
}): string {
  if (input.routineName) {
    return `The ${input.endpointDisplayName} changed because you started the ${input.routineName} routine and MapAble authorised this step (${input.authorityBasis}).`;
  }
  return `The ${input.endpointDisplayName} was updated for ${input.capabilityKind} because ${input.authorityBasis}.`;
}
