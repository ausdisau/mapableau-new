/**
 * Human Operations lifecycle — assign, request info, resolve.
 * Resolutions may prepare Action Kernel / Recovery next steps; never silently execute.
 */

import { appendHumanOpsAudit } from "./audit";
import { getHumanOpsReview, saveHumanOpsReview } from "./queue";
import { assertCanMutateReview } from "./rbac";
import type {
  HumanOpsOperatorContext,
  HumanOpsResolution,
  HumanOpsResolutionRecord,
  HumanOpsReviewItem,
  HumanOpsStatus,
} from "./types";
import { SAFEGUARDING_FORBIDDEN_RESOLUTIONS } from "./types";

export type LifecycleResult =
  | { ok: true; item: HumanOpsReviewItem }
  | { ok: false; reason: string };

const TERMINAL: HumanOpsStatus[] = ["resolved", "withdrawn"];

function assertNotTerminal(item: HumanOpsReviewItem): LifecycleResult | null {
  if (TERMINAL.includes(item.status)) {
    return { ok: false, reason: "REVIEW_TERMINAL" };
  }
  return null;
}

export function isSafeguardingResolutionAllowed(resolution: string): boolean {
  if (
    (SAFEGUARDING_FORBIDDEN_RESOLUTIONS as readonly string[]).includes(resolution)
  ) {
    return false;
  }
  const allowedForSafeguarding: HumanOpsResolution[] = [
    "request_information",
    "request_participant_decision",
    "route_to_specialist_human",
    "unable_to_assist",
    "continue_workflow",
  ];
  return (allowedForSafeguarding as string[]).includes(resolution);
}

export function rejectModelGeneratedSafeguardingDecision(input: {
  category: string;
  generatedByModel: boolean;
  resolution: string;
}): { ok: true } | { ok: false; reason: string } {
  if (input.category !== "safeguarding") return { ok: true };
  if (input.generatedByModel) {
    return { ok: false, reason: "MODEL_SAFEGUARDING_DECISION_FORBIDDEN" };
  }
  if (!isSafeguardingResolutionAllowed(input.resolution)) {
    return { ok: false, reason: "SAFEGUARDING_RESOLUTION_FORBIDDEN" };
  }
  return { ok: true };
}

export function assignHumanOpsReview(input: {
  reviewId: string;
  operator: HumanOpsOperatorContext;
  assigneeId: string;
  note?: string;
}): LifecycleResult {
  const item = getHumanOpsReview(input.reviewId);
  if (!item) return { ok: false, reason: "NOT_FOUND" };
  const gate = assertCanMutateReview(input.operator, item);
  if (!gate.ok) return gate;
  const terminal = assertNotTerminal(item);
  if (terminal) return terminal;

  item.assignedTo = input.assigneeId;
  item.status = "assigned";
  if (input.note) item.internalNotes.push(input.note);
  const audit = appendHumanOpsAudit({
    reviewId: item.reviewId,
    actorId: input.operator.operatorId,
    action: "assigned",
    tenantId: item.tenantId,
    detail: { assigneeId: input.assigneeId, note: input.note ?? null },
  });
  item.auditRefs.push(audit.auditId);
  saveHumanOpsReview(item);
  return { ok: true, item };
}

export function requestHumanOpsInformation(input: {
  reviewId: string;
  operator: HumanOpsOperatorContext;
  informationRequested: string;
  fromParticipant?: boolean;
}): LifecycleResult {
  const item = getHumanOpsReview(input.reviewId);
  if (!item) return { ok: false, reason: "NOT_FOUND" };
  const gate = assertCanMutateReview(input.operator, item);
  if (!gate.ok) return gate;
  const terminal = assertNotTerminal(item);
  if (terminal) return terminal;

  item.status = "awaiting_information";
  if (input.fromParticipant !== false) {
    item.whatHappensNext =
      `We need a little more information from you: ${input.informationRequested}`;
  }
  item.internalNotes.push(`Info requested: ${input.informationRequested}`);
  const audit = appendHumanOpsAudit({
    reviewId: item.reviewId,
    actorId: input.operator.operatorId,
    action: "request_information",
    tenantId: item.tenantId,
    detail: {
      informationRequested: input.informationRequested,
      fromParticipant: input.fromParticipant !== false,
    },
  });
  item.auditRefs.push(audit.auditId);
  saveHumanOpsReview(item);
  return { ok: true, item };
}

export function markHumanOpsInReview(input: {
  reviewId: string;
  operator: HumanOpsOperatorContext;
}): LifecycleResult {
  const item = getHumanOpsReview(input.reviewId);
  if (!item) return { ok: false, reason: "NOT_FOUND" };
  const gate = assertCanMutateReview(input.operator, item);
  if (!gate.ok) return gate;
  const terminal = assertNotTerminal(item);
  if (terminal) return terminal;

  item.status = "in_review";
  if (!item.assignedTo) item.assignedTo = input.operator.operatorId;
  const audit = appendHumanOpsAudit({
    reviewId: item.reviewId,
    actorId: input.operator.operatorId,
    action: "in_review",
    tenantId: item.tenantId,
    detail: {},
  });
  item.auditRefs.push(audit.auditId);
  saveHumanOpsReview(item);
  return { ok: true, item };
}

export function resolveHumanOpsReview(input: {
  reviewId: string;
  operator: HumanOpsOperatorContext;
  resolution: HumanOpsResolution;
  resolutionReason: string;
  evidenceRefsUsed?: string[];
  decidedUnderAuthority: string;
  participantApprovalBypassed: false;
  delegateAuthorityId?: string | null;
  nextStepsPrepared?: string[];
  internalNote?: string;
  generatedByModel?: boolean;
}): LifecycleResult {
  const item = getHumanOpsReview(input.reviewId);
  if (!item) return { ok: false, reason: "NOT_FOUND" };
  const gate = assertCanMutateReview(input.operator, item);
  if (!gate.ok) return gate;
  const terminal = assertNotTerminal(item);
  if (terminal) return terminal;

  const modelGate = rejectModelGeneratedSafeguardingDecision({
    category: item.category,
    generatedByModel: input.generatedByModel === true,
    resolution: input.resolution,
  });
  if (!modelGate.ok) return modelGate;

  if (
    item.category === "safeguarding" &&
    !isSafeguardingResolutionAllowed(input.resolution)
  ) {
    return { ok: false, reason: "SAFEGUARDING_RESOLUTION_FORBIDDEN" };
  }

  if (input.participantApprovalBypassed !== false) {
    return { ok: false, reason: "PARTICIPANT_APPROVAL_BYPASS_FORBIDDEN" };
  }

  const evidenceRefsUsed = input.evidenceRefsUsed ?? [];
  for (const ref of evidenceRefsUsed) {
    if (!item.evidenceRefs.includes(ref)) {
      return { ok: false, reason: "UNKNOWN_EVIDENCE_REF" };
    }
  }

  const resolutionRecord: HumanOpsResolutionRecord = {
    resolution: input.resolution,
    resolutionReason: input.resolutionReason,
    decidedBy: input.operator.operatorId,
    decidedUnderAuthority: input.decidedUnderAuthority,
    evidenceRefsUsed,
    participantApprovalBypassed: false,
    delegateAuthorityId: input.delegateAuthorityId ?? null,
    nextStepsPrepared: [...(input.nextStepsPrepared ?? [])],
    decidedAt: new Date().toISOString(),
  };

  item.resolution = resolutionRecord;
  item.resolutionReason = input.resolutionReason;
  item.status = "resolved";
  item.preparedNextStepIds = [...resolutionRecord.nextStepsPrepared];
  item.proposalReviewState =
    input.resolution === "request_participant_decision"
      ? "participant_correction_requested"
      : "amended";
  if (input.internalNote) item.internalNotes.push(input.internalNote);
  item.whatHappensNext = participantNextStepMessage(input.resolution);

  const audit = appendHumanOpsAudit({
    reviewId: item.reviewId,
    actorId: input.operator.operatorId,
    action: "resolved",
    tenantId: item.tenantId,
    detail: {
      resolution: input.resolution,
      decidedUnderAuthority: input.decidedUnderAuthority,
      participantApprovalBypassed: false,
      delegateAuthorityId: input.delegateAuthorityId ?? null,
      preparedCount: resolutionRecord.nextStepsPrepared.length,
    },
  });
  item.auditRefs.push(audit.auditId);
  saveHumanOpsReview(item);
  return { ok: true, item };
}

function participantNextStepMessage(resolution: HumanOpsResolution): string {
  switch (resolution) {
    case "continue_workflow":
      return "A human reviewer cleared coordination so your mission can continue. Any high-impact actions still need your approval.";
    case "request_participant_decision":
      return "A human reviewer needs your decision before anything else happens.";
    case "request_information":
      return "A human reviewer is waiting for more information from you.";
    case "prepare_action_proposal":
      return "A human reviewer prepared an action for your review. Nothing has been sent or booked yet.";
    case "prepare_recovery_alternative":
      return "A human reviewer prepared a recovery option for your review. Nothing has changed automatically.";
    case "route_to_specialist_human":
      return "Your case was routed to a specialist human team. AI will not decide the outcome.";
    case "close_coordination_only":
      return "Coordination is complete. No further automated action will run without your approval.";
    case "unable_to_assist":
      return "A human reviewer could not complete this request. Non-AI support routes remain available.";
    default: {
      const _exhaustive: never = resolution;
      return _exhaustive;
    }
  }
}

export function patchHumanOpsReview(input: {
  reviewId: string;
  operator: HumanOpsOperatorContext;
  status?: HumanOpsStatus;
  priority?: HumanOpsReviewItem["priority"];
  internalNote?: string;
  whatHappensNext?: string;
}): LifecycleResult {
  const item = getHumanOpsReview(input.reviewId);
  if (!item) return { ok: false, reason: "NOT_FOUND" };
  const gate = assertCanMutateReview(input.operator, item);
  if (!gate.ok) return gate;

  if (input.status === "resolved") {
    return { ok: false, reason: "USE_RESOLVE_ENDPOINT" };
  }
  if (input.status && TERMINAL.includes(item.status)) {
    return { ok: false, reason: "REVIEW_TERMINAL" };
  }

  if (input.status) item.status = input.status;
  if (input.priority) item.priority = input.priority;
  if (input.internalNote) item.internalNotes.push(input.internalNote);
  if (input.whatHappensNext) item.whatHappensNext = input.whatHappensNext;

  const audit = appendHumanOpsAudit({
    reviewId: item.reviewId,
    actorId: input.operator.operatorId,
    action: "patched",
    tenantId: item.tenantId,
    detail: {
      status: input.status ?? null,
      priority: input.priority ?? null,
    },
  });
  item.auditRefs.push(audit.auditId);
  saveHumanOpsReview(item);
  return { ok: true, item };
}
