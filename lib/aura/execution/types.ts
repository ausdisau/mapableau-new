import { z } from "zod";

import type { AuraProposalActionType } from "../proposals";

export const auraExecutionStateSchema = z.enum([
  "awaiting_execution_approval",
  "approval_granted",
  "approval_declined",
  "approval_expired",
  "preflight_rechecking",
  "authorisation_failed",
  "authorised",
  "queued",
  "executing",
  "service_receipt_received",
  "verifying_postconditions",
  "succeeded",
  "partially_succeeded",
  "failed",
  "timed_out",
  "cancel_requested",
  "cancelled",
  "cancellation_failed",
  "compensation_proposed",
  "compensation_approved",
  "compensating",
  "compensated",
  "compensation_failed",
  "human_review_required",
]);
export type AuraExecutionState = z.infer<typeof auraExecutionStateSchema>;

export const auraExecutionApprovalDecisionSchema = z.enum([
  "approved_for_execution",
  "declined",
  "cancelled",
]);
export type AuraExecutionApprovalDecision = z.infer<
  typeof auraExecutionApprovalDecisionSchema
>;

export type AuraExecutionApproval = {
  id: string;
  missionId: string;
  proposalId: string;
  proposalVersion: number;
  proposalHash: string;
  participantId: string;
  actionType: AuraProposalActionType;
  recipientSnapshot: { type: string; id?: string; label: string };
  purposeCode: string;
  disclosureSnapshot: {
    fieldsShared: string[];
    fieldsOmitted: string[];
  };
  expectedResult: string;
  possibleFailures: string[];
  fallbackPlan: string[];
  consentSnapshotIds: string[];
  policyVersion: string;
  servicePreflightVersion: string;
  decision: AuraExecutionApprovalDecision;
  approvedAt?: string;
  declinedAt?: string;
  cancelledAt?: string;
  expiresAt: string;
  authenticationContext: {
    sessionIdHash: string;
    stepUpVerified: boolean;
    stepUpMethod?: string;
  };
  futureReuseAllowed: false;
  usedAt?: string;
  usedByExecutionId?: string;
};

export type AuraPostconditionResult = {
  condition: string;
  passed: boolean;
  evidenceReference?: string;
};

export type AuraActionExecution = {
  id: string;
  missionId: string;
  proposalId: string;
  proposalVersion: number;
  proposalHash: string;
  executionApprovalId: string;
  actionType: AuraProposalActionType;
  serviceId: string;
  serviceVersion: string;
  state: AuraExecutionState;
  idempotencyKey: string;
  authorisedAt?: string;
  queuedAt?: string;
  startedAt?: string;
  serviceReceiptReceivedAt?: string;
  verificationStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  applicationReceiptId?: string;
  outboxEventIds: string[];
  recordsCreated: Array<{ recordType: string; recordId: string }>;
  deliveryState?: {
    channel: string;
    status:
      | "not_required"
      | "not_configured"
      | "queued"
      | "sent"
      | "delivered"
      | "failed"
      | "unknown";
    externalReference?: string;
  };
  postconditions: AuraPostconditionResult[];
  realWorldOutcome:
    | "not_observed"
    | "pending"
    | "participant_reported"
    | "externally_verified";
  failureCode?: string;
  failureMessage?: string;
  cancellationSupported: boolean;
  compensationSupported: boolean;
  auditCorrelationId: string;
};

export type AuraExecutionReceipt = {
  id: string;
  missionId: string;
  executionId: string;
  proposalId: string;
  proposalVersion: number;
  proposalHash: string;
  executionApprovalId: string;
  actionType: AuraProposalActionType;
  finalState:
    | "succeeded"
    | "partially_succeeded"
    | "failed"
    | "timed_out"
    | "cancelled"
    | "human_review_required";
  serviceReceipt: {
    serviceId: string;
    serviceVersion: string;
    receiptReference: string;
  };
  recordsCreated: Array<{ type: string; id: string }>;
  deliveries: Array<{ channel: string; state: string; reference?: string }>;
  postconditionSummary: AuraPostconditionResult[];
  realWorldOutcomeConfirmed: boolean;
  participantFacingSummary: string;
  limitations: string[];
  fallbackActions: string[];
  createdAt: string;
  auditCorrelationId: string;
};

export type AuraServiceReceipt = {
  receiptReference: string;
  recordsCreated: Array<{ recordType: string; recordId: string }>;
  deliveryState?: AuraActionExecution["deliveryState"];
  partial?: boolean;
  failureCode?: string;
  failureMessage?: string;
};

export type AuraServicePreflight = {
  passed: boolean;
  errors: string[];
  warnings: string[];
  adapterState: string;
  serviceAvailable: boolean;
};

export type AuraExecutionContext = {
  missionId: string;
  proposalId: string;
  participantId: string;
  tenantId?: string;
  actionType: AuraProposalActionType;
};

export type AuraAuthorisedExecutionContext = AuraExecutionContext & {
  executionId: string;
  approvalId: string;
  proposalHash: string;
  proposalVersion: number;
  payload: Record<string, unknown>;
  disclosure: {
    fieldsShared: string[];
    fieldsOmitted: string[];
  };
  recipient: { type: string; id?: string; label: string };
  idempotencyKey: string;
  correlationId: string;
};

export type AuraPostconditionContext = AuraAuthorisedExecutionContext & {
  serviceReceipt: AuraServiceReceipt;
};

export type AuraCancellationContext = {
  execution: AuraActionExecution;
  participantId: string;
  reason?: string;
};

export type AuraCancellationResult = {
  state: "cancelled" | "cancellation_failed" | "not_cancellable";
  message: string;
  compensationOffered?: boolean;
};

export type AuraCompensationContext = {
  execution: AuraActionExecution;
  participantId: string;
  compensationType: string;
};

export type AuraCompensationResult = {
  state: "proposed" | "compensated" | "failed";
  message: string;
  proposalId?: string;
};

export type FourKeyResult = {
  key:
    | "participant_mandate"
    | "policy_permission"
    | "application_preconditions"
    | "reality_verification";
  passed: boolean;
  failures: string[];
  warnings: string[];
};

export const ACTION_APPROVAL_LABELS: Record<AuraProposalActionType, string> = {
  venue_verification_request: "Confirm and send these access questions",
  visit_plan_share: "Confirm and share this Visit Plan",
  supporter_notification: "Confirm and notify my supporter",
  transport_request: "Confirm and create this transport request",
  barrier_report: "Confirm and submit this report for moderation",
};

export const ACTION_LIMITATION_NOTICES: Record<AuraProposalActionType, string> = {
  venue_verification_request:
    "Sending the request does not guarantee a venue response.",
  visit_plan_share:
    "Sharing does not guarantee the recipient has read or understood the plan.",
  supporter_notification:
    "Delivery does not guarantee the supporter has read the message.",
  transport_request:
    "This creates a request. It does not guarantee a confirmed ride.",
  barrier_report:
    "This sends the report to moderation. It does not publish it immediately.",
};
