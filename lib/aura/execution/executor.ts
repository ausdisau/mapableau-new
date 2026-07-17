import { randomUUID } from "crypto";

import { requireMission } from "../mission/store";
import {
  requireProposal,
  verifyAuraProposalHash,
} from "../proposals";
import { assertMissionNotStopped } from "../stop";
import { appendWitness } from "../witness";
import {
  getExecutionApproval,
  grantExecutionApproval,
  markApprovalUsed,
  validateApprovalForExecution,
} from "./approval";
import { allFourKeysPassed, runFourKeyRule } from "./four-key";
import { isActionExecutionEnabled } from "./flags";
import { enqueueOutboxEvent } from "./outbox";
import { resolveExecutionService } from "./registry";
import {
  cancelQueuedExecutionsForMission,
  createExecutionRecord,
  getExecution,
  getExecutionByIdempotencyKey,
  getExecutionReceipt,
  requireExecution,
  saveExecutionReceipt,
  transitionExecution,
} from "./store";
import {
  ACTION_LIMITATION_NOTICES,
  type AuraActionExecution,
  type AuraExecutionReceipt,
  type AuraPostconditionResult,
} from "./types";

function buildIdempotencyKey(proposalId: string, version: number, hash: string): string {
  return `aura-exec-${proposalId}-v${version}-${hash.slice(0, 16)}`;
}

function participantSummary(
  actionType: AuraActionExecution["actionType"],
  deliveryStatus?: string,
): string {
  switch (actionType) {
    case "transport_request":
      return "Your transport request was created. A vehicle has not yet been confirmed.";
    case "venue_verification_request":
      return "Your questions were sent to the configured venue contact. A response has not yet been received.";
    case "barrier_report":
      return "Your report was submitted for moderation. It has not been published.";
    case "visit_plan_share":
      return "The Visit Plan was shared with a time limit. You can revoke access.";
    case "supporter_notification":
      return deliveryStatus === "delivered"
        ? "Your supporter was notified. Read receipt is not confirmed."
        : "Your supporter notification was queued for delivery.";
    default:
      return "The action was recorded. Real-world outcome is not yet confirmed.";
  }
}

export async function executeApprovedProposal(input: {
  proposalId: string;
  participantId: string;
  approvalId: string;
  sessionId?: string;
  stepUpVerified?: boolean;
}): Promise<{
  execution: AuraActionExecution;
  receipt: AuraExecutionReceipt;
  fourKey: Awaited<ReturnType<typeof runFourKeyRule>>;
}> {
  const proposal = requireProposal(input.proposalId);
  const mission = requireMission(proposal.missionId);
  if (mission.participantId !== input.participantId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);
  if (!verifyAuraProposalHash(proposal)) {
    throw new Error("AURA_PROPOSAL_HASH_MISMATCH");
  }
  if (!isActionExecutionEnabled(proposal.actionType)) {
    throw new Error("AURA_EXECUTION_ACTION_DISABLED");
  }

  const idempotencyKey = buildIdempotencyKey(
    proposal.id,
    proposal.version,
    proposal.proposalHash,
  );
  const existing = getExecutionByIdempotencyKey(idempotencyKey);
  if (existing) {
    const receipt = getExecutionReceipt(existing.id);
    if (!receipt) throw new Error("AURA_RECEIPT_MISSING");
    const fourKey = await runFourKeyRule({
      execution: existing,
      participantId: input.participantId,
      approvalId: input.approvalId,
      postDispatch: true,
      serviceReceiptReceived: true,
      postconditions: existing.postconditions,
    });
    appendWitness({
      missionId: mission.id,
      type: "execution.duplicate_suppressed",
      summary: "Duplicate execution request returned original execution",
      correlationId: mission.correlationId,
      payload: { executionId: existing.id, idempotencyKey },
    });
    return { execution: existing, receipt, fourKey };
  }

  const approval = getExecutionApproval(input.approvalId);
  if (!approval) throw new Error("AURA_EXECUTION_APPROVAL_MISSING");
  validateApprovalForExecution(
    approval,
    proposal.id,
    proposal.version,
    proposal.proposalHash,
    input.participantId,
  );

  const service = resolveExecutionService(proposal.actionType);

  const draftExecution: AuraActionExecution = {
    id: randomUUID(),
    missionId: mission.id,
    proposalId: proposal.id,
    proposalVersion: proposal.version,
    proposalHash: proposal.proposalHash,
    executionApprovalId: approval.id,
    actionType: proposal.actionType,
    serviceId: service.serviceId,
    serviceVersion: service.serviceVersion,
    state: "preflight_rechecking",
    idempotencyKey,
    outboxEventIds: [],
    recordsCreated: [],
    postconditions: [],
    realWorldOutcome: "not_observed",
    cancellationSupported: service.supportsCancellation,
    compensationSupported: service.supportsCompensation,
    auditCorrelationId: mission.correlationId,
  };

  let fourKey = await runFourKeyRule({
    execution: draftExecution,
    participantId: input.participantId,
    approvalId: approval.id,
  });
  if (!allFourKeysPassed(fourKey)) {
    throw new Error("AURA_EXECUTION_AUTHORISATION_FAILED");
  }

  const execution = createExecutionRecord({
    missionId: mission.id,
    proposalId: proposal.id,
    proposalVersion: proposal.version,
    proposalHash: proposal.proposalHash,
    executionApprovalId: approval.id,
    actionType: proposal.actionType,
    serviceId: service.serviceId,
    serviceVersion: service.serviceVersion,
    idempotencyKey,
    cancellationSupported: service.supportsCancellation,
    compensationSupported: service.supportsCompensation,
    auditCorrelationId: mission.correlationId,
  });

  fourKey = await runFourKeyRule({
    execution,
    participantId: input.participantId,
    approvalId: approval.id,
  });
  if (!allFourKeysPassed(fourKey)) {
    transitionExecution(execution.id, "authorisation_failed", {
      failureCode: "FOUR_KEY_FAILED",
      failureMessage: fourKey
        .filter((k) => !k.passed)
        .map((k) => k.key)
        .join(","),
    });
    throw new Error("AURA_EXECUTION_AUTHORISATION_FAILED");
  }

  transitionExecution(execution.id, "queued", {
    queuedAt: new Date().toISOString(),
  });
  appendWitness({
    missionId: mission.id,
    type: "execution.queued",
    summary: `Execution queued: ${proposal.actionType}`,
    correlationId: mission.correlationId,
    payload: { executionId: execution.id },
  });

  transitionExecution(execution.id, "executing", {
    startedAt: new Date().toISOString(),
  });
  appendWitness({
    missionId: mission.id,
    type: "execution.started",
    summary: "Application service dispatch started",
    correlationId: mission.correlationId,
    payload: { executionId: execution.id, serviceId: service.serviceId },
  });

  const authCtx = {
    missionId: mission.id,
    proposalId: proposal.id,
    participantId: input.participantId,
    actionType: proposal.actionType,
    executionId: execution.id,
    approvalId: approval.id,
    proposalHash: proposal.proposalHash,
    proposalVersion: proposal.version,
    payload: proposal.payload,
    disclosure: {
      fieldsShared: proposal.disclosure.fieldsShared.map((f) => f.key),
      fieldsOmitted: proposal.disclosure.fieldsOmitted.map((f) => f.key),
    },
    recipient: {
      type: proposal.target.recipientType,
      id: proposal.target.recipientId,
      label: proposal.target.recipientLabel,
    },
    idempotencyKey,
    correlationId: mission.correlationId,
  };

  const serviceReceipt = await service.execute(authCtx);
  const outbox = enqueueOutboxEvent({
    missionId: mission.id,
    proposalId: proposal.id,
    executionId: execution.id,
    correlationId: mission.correlationId,
    causationId: execution.id,
    eventType: `aura.execution.${proposal.actionType}`,
    payload: {
      receiptReference: serviceReceipt.receiptReference,
      recordsCreated: serviceReceipt.recordsCreated,
    },
  });

  let current = transitionExecution(execution.id, "service_receipt_received", {
    serviceReceiptReceivedAt: new Date().toISOString(),
    applicationReceiptId: serviceReceipt.receiptReference,
    recordsCreated: serviceReceipt.recordsCreated,
    deliveryState: serviceReceipt.deliveryState,
    outboxEventIds: [outbox.id],
  });

  appendWitness({
    missionId: mission.id,
    type: "execution.service_receipt_received",
    summary: "Structured service receipt received",
    correlationId: mission.correlationId,
    payload: {
      executionId: execution.id,
      receiptReference: serviceReceipt.receiptReference,
    },
  });

  current = transitionExecution(execution.id, "verifying_postconditions", {
    verificationStartedAt: new Date().toISOString(),
  });

  const postRows = await service.verifyPostconditions({
    ...authCtx,
    serviceReceipt,
  });
  const postconditions: AuraPostconditionResult[] = postRows.map((r) => ({
    condition: r.condition,
    passed: r.passed,
    evidenceReference: r.evidenceReference,
  }));

  const postFailed = postconditions.some((p) => !p.passed);
  const finalState = postFailed
    ? serviceReceipt.partial
      ? "partially_succeeded"
      : "failed"
    : serviceReceipt.partial
      ? "partially_succeeded"
      : "succeeded";

  current = transitionExecution(execution.id, finalState, {
    postconditions,
    completedAt: new Date().toISOString(),
    realWorldOutcome: "not_observed",
    failureCode: postFailed ? "POSTCONDITION_FAILED" : undefined,
  });

  appendWitness({
    missionId: mission.id,
    type: postFailed
      ? "execution.postcondition_failed"
      : "execution.postcondition_verified",
    summary: postFailed ? "Postcondition verification failed" : "Postconditions verified",
    correlationId: mission.correlationId,
    payload: { executionId: execution.id, postconditions },
  });

  markApprovalUsed(approval.id, execution.id);

  const receipt: AuraExecutionReceipt = {
    id: randomUUID(),
    missionId: mission.id,
    executionId: execution.id,
    proposalId: proposal.id,
    proposalVersion: proposal.version,
    proposalHash: proposal.proposalHash,
    executionApprovalId: approval.id,
    actionType: proposal.actionType,
    finalState:
      finalState === "succeeded" || finalState === "partially_succeeded"
        ? finalState
        : "failed",
    serviceReceipt: {
      serviceId: service.serviceId,
      serviceVersion: service.serviceVersion,
      receiptReference: serviceReceipt.receiptReference,
    },
    recordsCreated: serviceReceipt.recordsCreated.map((r) => ({
      type: r.recordType,
      id: r.recordId,
    })),
    deliveries: serviceReceipt.deliveryState
      ? [
          {
            channel: serviceReceipt.deliveryState.channel,
            state: serviceReceipt.deliveryState.status,
            reference: serviceReceipt.deliveryState.externalReference,
          },
        ]
      : [],
    postconditionSummary: postconditions,
    realWorldOutcomeConfirmed: false,
    participantFacingSummary: participantSummary(
      proposal.actionType,
      serviceReceipt.deliveryState?.status,
    ),
    limitations: [ACTION_LIMITATION_NOTICES[proposal.actionType]],
    fallbackActions: proposal.fallbackPlan,
    createdAt: new Date().toISOString(),
    auditCorrelationId: mission.correlationId,
  };
  saveExecutionReceipt(receipt);

  appendWitness({
    missionId: mission.id,
    type:
      finalState === "succeeded"
        ? "execution.succeeded"
        : finalState === "partially_succeeded"
          ? "execution.partially_succeeded"
          : "execution.failed",
    summary: receipt.participantFacingSummary,
    correlationId: mission.correlationId,
    payload: { executionId: execution.id, receiptId: receipt.id },
  });

  fourKey = await runFourKeyRule({
    execution: current,
    participantId: input.participantId,
    approvalId: approval.id,
    postDispatch: true,
    serviceReceiptReceived: true,
    postconditions,
  });

  return { execution: current, receipt, fourKey };
}

export function stopExecutionForMission(missionId: string): {
  cancelledExecutions: string[];
} {
  const cancelledExecutions = cancelQueuedExecutionsForMission(missionId);
  return { cancelledExecutions };
}

export async function cancelExecution(input: {
  executionId: string;
  participantId: string;
  reason?: string;
}): Promise<AuraActionExecution> {
  const execution = requireExecution(input.executionId);
  const mission = requireMission(execution.missionId);
  if (mission.participantId !== input.participantId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  if (execution.state === "queued" || execution.state === "authorised") {
    return transitionExecution(execution.id, "cancelled", {
      cancelledAt: new Date().toISOString(),
    });
  }

  const service = resolveExecutionService(execution.actionType);
  if (!service.cancel) {
    throw new Error("AURA_CANCELLATION_UNSUPPORTED");
  }
  transitionExecution(execution.id, "cancel_requested");
  const result = await service.cancel({ execution, participantId: input.participantId, reason: input.reason });
  if (result.state === "cancelled") {
    return transitionExecution(execution.id, "cancelled", {
      cancelledAt: new Date().toISOString(),
    });
  }
  return transitionExecution(execution.id, "cancellation_failed", {
    failureMessage: result.message,
  });
}

export { grantExecutionApproval, getExecution, getExecutionReceipt };
