import { randomUUID } from "node:crypto";

import type { MissionActionProposal } from "@/lib/ai/platform/missions/types";
import type { CurrentUser } from "@/lib/auth/current-user";

import { runActionAdapter } from "./adapters";
import {
  approveActionProposal,
  buildExecutionIdempotencyKey,
  createActionProposal,
  rejectActionProposal,
} from "./approvals";
import { evaluateExecutionPolicy } from "./policy";
import {
  getMapAbleActionDefinition,
  missionActionTypeToKernelKey,
} from "./registry";
import {
  claimIdempotencyKey,
  consumeNonce,
  getIdempotentResultId,
  isNonceConsumed,
  recordIdempotentCompletion,
} from "./replay";
import { appendMissionActionResult } from "./result";
import {
  getActionProposal,
  getApprovalBinding,
  updateActionProposal,
} from "./store";
import type {
  ActionExecutionRequest,
  ApprovalBinding,
  MapAbleActionProposal,
  MapAbleActionResult,
} from "./types";

export type ExecuteActionContext = {
  participantId: string;
  actorId: string;
  user: CurrentUser;
};

export function prepareKernelProposalFromMission(input: {
  missionProposal: MissionActionProposal;
  missionId: string;
  traceId: string;
  participantId: string;
  actorId: string;
  consentScopes: string[];
}): MapAbleActionProposal | null {
  const actionKey = missionActionTypeToKernelKey(input.missionProposal.action);
  if (!actionKey) return null;

  const kernelPayload = buildKernelPayload(
    actionKey,
    input.missionProposal.payload,
  );

  return createActionProposal({
    missionId: input.missionId,
    traceId: input.traceId,
    actionKey,
    participantId: input.participantId,
    actorId: input.actorId,
    payload: kernelPayload,
    informationToShare: input.missionProposal.informationToShare,
    purpose: input.missionProposal.purpose,
    consentScopes: input.consentScopes,
    missionProposalId: input.missionProposal.id,
  });
}

function buildKernelPayload(
  actionKey: string,
  missionPayload: Record<string, unknown>,
): Record<string, unknown> {
  if (actionKey === "submit_care_request") {
    return {
      requestType: "employment_support",
      title: "Support for mission goal",
      description: String(missionPayload.objective ?? missionPayload.supportPurpose ?? "Support request from mission plan"),
      linkedTransportRequired: false,
    };
  }
  if (actionKey === "submit_transport_request") {
    const scheduled = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return {
      pickupAddress: "To be confirmed by participant",
      dropoffAddress: "To be confirmed by participant",
      scheduledStart: scheduled,
      mobilityRequirements: {
        requiresWheelchairAccessible:
          missionPayload.mobilityRequirement ===
          "requires_wheelchair_accessible_vehicle",
      },
    };
  }
  if (actionKey === "request_human_coordination") {
    return {
      category: "general_coordination",
      title: "Mission coordination request",
      summary: String(missionPayload.summary ?? missionPayload.objective ?? "Participant requested human coordination"),
      priority: "attention",
    };
  }
  return missionPayload;
}

export function executeApprovedAction(
  request: ActionExecutionRequest,
  ctx: ExecuteActionContext,
): Promise<MapAbleActionResult> {
  return executeApprovedActionInternal(request, ctx);
}

async function executeApprovedActionInternal(
  request: ActionExecutionRequest,
  ctx: ExecuteActionContext,
): Promise<MapAbleActionResult> {
  const proposal = getActionProposal(request.proposalId);
  if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");

  const binding = getApprovalBinding(request.approvalId);
  if (!binding || binding.proposalId !== request.proposalId) {
    throw new Error("APPROVAL_BINDING_INVALID");
  }

  if (binding.nonce !== request.nonce) {
    throw new Error("NONCE_MISMATCH");
  }

  if (proposal.participantId !== ctx.participantId) {
    throw new Error("PARTICIPANT_MISMATCH");
  }

  if (binding.payloadHash !== proposal.payloadHash) {
    throw new Error("PAYLOAD_HASH_MISMATCH");
  }

  const idempotencyKey = buildExecutionIdempotencyKey(binding);
  const idempotencyClaim = claimIdempotencyKey(idempotencyKey);
  if (!idempotencyClaim.claimed) {
    const existingResultId = getIdempotentResultId(idempotencyKey);
    if (existingResultId) {
      return buildReplayResult(proposal, binding, existingResultId, idempotencyKey);
    }
    throw new Error("IDEMPOTENCY_CONFLICT");
  }

  const policy = evaluateExecutionPolicy({
    proposal,
    bindingPayloadHash: binding.payloadHash,
  });
  if (!policy.allowed) {
    throw new Error(policy.reasonCode ?? "EXECUTION_POLICY_DENIED");
  }

  if (isNonceConsumed(binding.nonce)) {
    throw new Error("NONCE_ALREADY_CONSUMED");
  }

  if (!consumeNonce(binding.nonce)) {
    throw new Error("NONCE_ALREADY_CONSUMED");
  }

  const definition = getMapAbleActionDefinition(proposal.actionKey);
  const resultId = randomUUID();

  try {
    const adapterResult = await runActionAdapter(
      proposal.actionKey,
      proposal.payload,
      {
        participantId: ctx.participantId,
        actorId: ctx.actorId,
        user: ctx.user,
        idempotencyKey,
      },
    );

    recordIdempotentCompletion(idempotencyKey, resultId);
    updateActionProposal(proposal.proposalId, { status: "executed" });

    const result: MapAbleActionResult = {
      resultId,
      proposalId: proposal.proposalId,
      approvalId: binding.approvalId,
      actionKey: proposal.actionKey,
      status: "completed",
      outcomeLabel: definition.successOutcomeLabel,
      entityType: adapterResult.entityType,
      entityId: adapterResult.entityId,
      payloadHash: proposal.payloadHash,
      idempotencyKey,
      executedAt: new Date().toISOString(),
      errorCode: null,
      missionFeedback: `${definition.successOutcomeLabel}: ${adapterResult.outcomeDetail}`,
    };

    return result;
  } catch (error) {
    updateActionProposal(proposal.proposalId, { status: "failed" });
    const errorCode =
      error instanceof Error ? error.message : "ACTION_EXECUTION_FAILED";
    return {
      resultId,
      proposalId: proposal.proposalId,
      approvalId: binding.approvalId,
      actionKey: proposal.actionKey,
      status: "failed",
      outcomeLabel: definition.successOutcomeLabel,
      entityType: null,
      entityId: null,
      payloadHash: proposal.payloadHash,
      idempotencyKey,
      executedAt: new Date().toISOString(),
      errorCode,
      missionFeedback: `Action failed: ${errorCode}`,
    };
  }
}

function buildReplayResult(
  proposal: MapAbleActionProposal,
  binding: ApprovalBinding,
  resultId: string,
  idempotencyKey: string,
): MapAbleActionResult {
  const definition = getMapAbleActionDefinition(proposal.actionKey);
  return {
    resultId,
    proposalId: proposal.proposalId,
    approvalId: binding.approvalId,
    actionKey: proposal.actionKey,
    status: "completed",
    outcomeLabel: definition.successOutcomeLabel,
    entityType: null,
    entityId: null,
    payloadHash: proposal.payloadHash,
    idempotencyKey,
    executedAt: new Date().toISOString(),
    errorCode: null,
    missionFeedback: `${definition.successOutcomeLabel} (idempotent replay)`,
  };
}

export {
  createActionProposal,
  approveActionProposal,
  rejectActionProposal,
  getActionProposal,
  getApprovalBinding,
};

export function recordMissionActionResult(
  missionId: string,
  result: MapAbleActionResult,
): void {
  appendMissionActionResult(missionId, result);
}
