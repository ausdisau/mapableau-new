import { createHash, randomUUID } from "crypto";

import { assertMissionNotStopped } from "../stop";
import { appendWitness } from "../witness";
import {
  requireProposal,
  verifyAuraActionProposal,
  verifyAuraProposalHash,
  runPreflight,
  type AuraProposalActionType,
} from "../proposals";
import { requireMission } from "../mission/store";
import {
  ACTION_APPROVAL_LABELS,
  ACTION_LIMITATION_NOTICES,
  type AuraExecutionApproval,
  type AuraExecutionApprovalDecision,
} from "./types";
import { isActionExecutionEnabled } from "./flags";

const approvals = new Map<string, AuraExecutionApproval>();
const approvalsByProposal = new Map<string, string>();

export const AURA_EXECUTION_POLICY_VERSION = "aura-execution-policy@1";
export const AURA_SERVICE_PREFLIGHT_VERSION = "aura-service-preflight@1";

export function resetExecutionApprovalStore(): void {
  approvals.clear();
  approvalsByProposal.clear();
}

export function getExecutionApproval(id: string): AuraExecutionApproval | null {
  return approvals.get(id) ?? null;
}

export function getExecutionApprovalForProposal(
  proposalId: string,
): AuraExecutionApproval | null {
  const aid = approvalsByProposal.get(proposalId);
  if (!aid) return null;
  return approvals.get(aid) ?? null;
}

function hashSession(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex").slice(0, 16);
}

function requiresStepUp(
  actionType: AuraProposalActionType,
  fieldsShared: string[],
): boolean {
  if (fieldsShared.some((f) => f.includes("pickup") || f.includes("home"))) {
    return true;
  }
  if (actionType === "visit_plan_share") return true;
  if (actionType === "supporter_notification") return true;
  if (actionType === "transport_request") return true;
  return false;
}

export function requestExecutionApproval(input: {
  proposalId: string;
  participantId: string;
  sessionId?: string;
  stepUpVerified?: boolean;
  stepUpMethod?: string;
}): {
  approval: AuraExecutionApproval | null;
  requiresStepUp: boolean;
  approvalLabel: string;
  limitationNotice: string;
} {
  const proposal = requireProposal(input.proposalId);
  const mission = requireMission(proposal.missionId);
  if (mission.participantId !== input.participantId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);

  if (
    proposal.state !== "shadow_allowed" &&
    proposal.state !== "shadow_indeterminate"
  ) {
    throw new Error("AURA_EXECUTION_SHADOW_REQUIRED");
  }

  verifyAuraActionProposal(proposal.id);
  if (!verifyAuraProposalHash(proposal)) {
    throw new Error("AURA_PROPOSAL_HASH_MISMATCH");
  }

  const fieldsShared = proposal.disclosure.fieldsShared.map((f) => f.key);
  const fieldsOmitted = proposal.disclosure.fieldsOmitted.map((f) => f.key);
  const stepUpRequired = requiresStepUp(proposal.actionType, fieldsShared);

  const preflight = runPreflight(proposal.actionType, proposal.payload);
  const expiresAt = new Date(
    Math.min(Date.parse(proposal.expiresAt), Date.now() + 30 * 60 * 1000),
  ).toISOString();

  const existing = getExecutionApprovalForProposal(proposal.id);
  if (
    existing &&
    existing.proposalHash === proposal.proposalHash &&
    existing.proposalVersion === proposal.version &&
    existing.decision === "approved_for_execution" &&
    !existing.usedAt &&
    Date.parse(existing.expiresAt) > Date.now()
  ) {
    return {
      approval: existing,
      requiresStepUp: stepUpRequired,
      approvalLabel: ACTION_APPROVAL_LABELS[proposal.actionType],
      limitationNotice: ACTION_LIMITATION_NOTICES[proposal.actionType],
    };
  }

  const approval: AuraExecutionApproval = {
    id: randomUUID(),
    missionId: mission.id,
    proposalId: proposal.id,
    proposalVersion: proposal.version,
    proposalHash: proposal.proposalHash,
    participantId: input.participantId,
    actionType: proposal.actionType,
    recipientSnapshot: {
      type: proposal.target.recipientType,
      id: proposal.target.recipientId,
      label: proposal.target.recipientLabel,
    },
    purposeCode: proposal.purpose.code,
    disclosureSnapshot: { fieldsShared, fieldsOmitted },
    expectedResult: proposal.expectedResult,
    possibleFailures: proposal.possibleFailures,
    fallbackPlan: proposal.fallbackPlan,
    consentSnapshotIds: preflight.requiredConsent,
    policyVersion: AURA_EXECUTION_POLICY_VERSION,
    servicePreflightVersion: AURA_SERVICE_PREFLIGHT_VERSION,
    decision: "approved_for_execution",
    expiresAt,
    authenticationContext: {
      sessionIdHash: hashSession(input.sessionId ?? "anonymous"),
      stepUpVerified: Boolean(input.stepUpVerified),
      stepUpMethod: input.stepUpMethod,
    },
    futureReuseAllowed: false,
  };

  approvals.set(approval.id, approval);
  approvalsByProposal.set(proposal.id, approval.id);

  appendWitness({
    missionId: mission.id,
    type: "execution.approval_requested",
    summary: `Execution approval requested for ${proposal.actionType}`,
    correlationId: mission.correlationId,
    actorType: "participant",
    actorId: input.participantId,
    payload: {
      approvalId: approval.id,
      proposalId: proposal.id,
      proposalHash: proposal.proposalHash,
      notShadowApproval: true,
    },
  });

  return {
    approval,
    requiresStepUp: stepUpRequired,
    approvalLabel: ACTION_APPROVAL_LABELS[proposal.actionType],
    limitationNotice: ACTION_LIMITATION_NOTICES[proposal.actionType],
  };
}

export function grantExecutionApproval(input: {
  proposalId: string;
  participantId: string;
  decision: AuraExecutionApprovalDecision;
  sessionId?: string;
  stepUpVerified?: boolean;
  stepUpMethod?: string;
}): AuraExecutionApproval {
  const proposal = requireProposal(input.proposalId);
  const mission = requireMission(proposal.missionId);
  if (mission.participantId !== input.participantId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  assertMissionNotStopped(mission);

  if (!isActionExecutionEnabled(proposal.actionType)) {
    throw new Error("AURA_EXECUTION_ACTION_DISABLED");
  }

  const fieldsShared = proposal.disclosure.fieldsShared.map((f) => f.key);
  const stepUpRequired = requiresStepUp(proposal.actionType, fieldsShared);
  if (stepUpRequired && !input.stepUpVerified) {
    throw new Error("AURA_STEP_UP_REQUIRED");
  }

  const { approval } = requestExecutionApproval({
    proposalId: input.proposalId,
    participantId: input.participantId,
    sessionId: input.sessionId,
    stepUpVerified: input.stepUpVerified,
    stepUpMethod: input.stepUpMethod,
  });
  if (!approval) throw new Error("AURA_EXECUTION_APPROVAL_MISSING");

  const now = new Date().toISOString();
  const updated: AuraExecutionApproval = {
    ...approval,
    decision: input.decision,
    approvedAt:
      input.decision === "approved_for_execution" ? now : undefined,
    declinedAt: input.decision === "declined" ? now : undefined,
    cancelledAt: input.decision === "cancelled" ? now : undefined,
    authenticationContext: {
      sessionIdHash: hashSession(input.sessionId ?? "anonymous"),
      stepUpVerified: Boolean(input.stepUpVerified),
      stepUpMethod: input.stepUpMethod,
    },
  };
  approvals.set(updated.id, updated);

  appendWitness({
    missionId: mission.id,
    type:
      input.decision === "approved_for_execution"
        ? "execution.approval_granted"
        : input.decision === "declined"
          ? "execution.approval_declined"
          : "execution.approval_cancelled",
    summary: `Execution approval ${input.decision} (not shadow review)`,
    correlationId: mission.correlationId,
    actorType: "participant",
    actorId: input.participantId,
    payload: {
      approvalId: updated.id,
      proposalId: proposal.id,
      proposalHash: proposal.proposalHash,
      futureReuseAllowed: false,
    },
  });

  return updated;
}

export function markApprovalUsed(
  approvalId: string,
  executionId: string,
): void {
  const approval = approvals.get(approvalId);
  if (!approval) return;
  approvals.set(approvalId, {
    ...approval,
    usedAt: new Date().toISOString(),
    usedByExecutionId: executionId,
  });
}

export function invalidateUnusedApprovalsForMission(missionId: string): string[] {
  const invalidated: string[] = [];
  for (const [id, approval] of approvals) {
    if (
      approval.missionId === missionId &&
      !approval.usedAt &&
      approval.decision === "approved_for_execution"
    ) {
      approvals.set(id, {
        ...approval,
        decision: "cancelled",
        cancelledAt: new Date().toISOString(),
      });
      invalidated.push(id);
      appendWitness({
        missionId,
        type: "execution.approval_expired",
        summary: "Unused execution approval invalidated (Stop AURA)",
        correlationId: missionId,
        payload: { approvalId: id },
      });
    }
  }
  return invalidated;
}

export function validateApprovalForExecution(
  approval: AuraExecutionApproval,
  proposalId: string,
  proposalVersion: number,
  proposalHash: string,
  participantId: string,
): void {
  if (approval.proposalId !== proposalId) {
    throw new Error("AURA_APPROVAL_PROPOSAL_MISMATCH");
  }
  if (approval.proposalVersion !== proposalVersion) {
    throw new Error("AURA_APPROVAL_VERSION_MISMATCH");
  }
  if (approval.proposalHash !== proposalHash) {
    throw new Error("AURA_APPROVAL_HASH_MISMATCH");
  }
  if (approval.participantId !== participantId) {
    throw new Error("AURA_APPROVAL_PARTICIPANT_MISMATCH");
  }
  if (approval.decision !== "approved_for_execution") {
    throw new Error("AURA_APPROVAL_NOT_GRANTED");
  }
  if (approval.usedAt) {
    throw new Error("AURA_APPROVAL_ALREADY_USED");
  }
  if (Date.parse(approval.expiresAt) <= Date.now()) {
    throw new Error("AURA_APPROVAL_EXPIRED");
  }
  if (approval.futureReuseAllowed !== false) {
    throw new Error("AURA_APPROVAL_REUSE_FORBIDDEN");
  }
}

export function rejectShadowReviewAsExecution(): never {
  throw new Error("AURA_SHADOW_REVIEW_NOT_EXECUTION_APPROVAL");
}
