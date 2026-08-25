import type { HomeCapabilityKind, HomeRiskClass } from "./capability";
import type { CapabilityState } from "./state";

export type HomeActionRequest = {
  id: string;
  correlationId: string;
  participantId: string;
  actorId: string;
  endpointId: string;
  capabilityKind: HomeCapabilityKind;
  parameters?: Record<string, unknown>;
  requestedAt: string;
  explanation?: string;
  vendorPermissionClaimed?: boolean;
  confirmationToken?: string;
  delegationId?: string;
};

/** Only this type may reach adapter.execute(). */
export type AuthorizedHomeAction = {
  id: string;
  requestId: string;
  correlationId: string;
  participantId: string;
  actorId: string;
  endpointId: string;
  capabilityKind: HomeCapabilityKind;
  riskClass: HomeRiskClass;
  parameters?: Record<string, unknown>;
  authorityBasis: string;
  authorizedAt: string;
  adapterId: string;
};

export type HomeActionResultCode =
  | "SUCCEEDED"
  | "FAILED"
  | "NOT_SUPPORTED"
  | "CANCELLED"
  | "UNKNOWN_STATE";

export type HomeActionReceipt = {
  id: string;
  actionId: string;
  requestId: string;
  correlationId: string;
  capabilityKind: HomeCapabilityKind;
  endpointId: string;
  requestedBy: string;
  authorityBasis: string;
  adapterId: string;
  startedAt: string;
  completedAt: string;
  result: HomeActionResultCode;
  stateBefore: CapabilityState | null;
  stateAfter: CapabilityState | null;
  explanation: string;
  undoAvailable: boolean;
};
