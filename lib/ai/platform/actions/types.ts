import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";

/** Phase 02 governed action keys — request / communication / preference only. */
export const MAPABLE_ACTION_KEYS = [
  "save_participant_preference",
  "request_human_coordination",
  "submit_care_request",
  "submit_transport_request",
  "send_provider_message",
] as const;

export type MapAbleActionKey = (typeof MAPABLE_ACTION_KEYS)[number];

export const ACTION_PROPOSAL_STATUSES = [
  "draft",
  "proposed",
  "awaiting_approval",
  "approved",
  "rejected",
  "expired",
  "executed",
  "failed",
  "cancelled",
] as const;

export type ActionProposalStatus = (typeof ACTION_PROPOSAL_STATUSES)[number];

export const ACTION_POLICY_REASON_CODES = [
  "action_kernel_disabled",
  "action_kernel_kill_switch",
  "action_type_disabled",
  "authority_insufficient",
  "prohibited_action",
  "invalid_payload",
  "missing_consent",
  "proposal_expired",
  "proposal_not_approvable",
  "approval_binding_invalid",
  "payload_hash_mismatch",
  "nonce_already_consumed",
  "idempotency_conflict",
  "participant_mismatch",
  "human_review_required",
] as const;

export type ActionPolicyReasonCode = (typeof ACTION_POLICY_REASON_CODES)[number];

export type ActionPolicyDecision = {
  allowed: boolean;
  reasonCode?: ActionPolicyReasonCode;
  detail?: string;
  effectiveAuthority: AuthorityCeiling;
};

export type MapAbleActionDefinition = {
  key: MapAbleActionKey;
  label: string;
  description: string;
  authorityCeiling: AuthorityCeiling;
  requiredConsentScopes: string[];
  requiredApprovals: Array<"participant" | "human" | "coordinator">;
  consequenceKinds: Array<"CONTACT" | "SHARE" | "BOOK" | "SPEND" | "AUTHORITY">;
  /** Human-readable outcome — e.g. "submitted" not "booked". */
  successOutcomeLabel: string;
};

export type MapAbleActionProposal = {
  proposalId: string;
  missionId: string;
  traceId: string;
  actionKey: MapAbleActionKey;
  participantId: string;
  actorId: string;
  payload: Record<string, unknown>;
  payloadHash: string;
  informationToShare: string[];
  purpose: string;
  consentScopes: string[];
  status: ActionProposalStatus;
  missionProposalId: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export type ApprovalBinding = {
  approvalId: string;
  proposalId: string;
  payloadHash: string;
  nonce: string;
  consentScopes: string[];
  approvedInformationToShareHash: string;
  actorId: string;
  actorType: "participant" | "authorised_human";
  approvedAt: string;
  expiresAt: string;
};

export type MapAbleActionResult = {
  resultId: string;
  proposalId: string;
  approvalId: string;
  actionKey: MapAbleActionKey;
  status: "completed" | "failed";
  outcomeLabel: string;
  entityType: string | null;
  entityId: string | null;
  payloadHash: string;
  idempotencyKey: string;
  executedAt: string;
  errorCode: string | null;
  /** Fed back to Mission Runtime */
  missionFeedback: string;
};

export type ActionExecutionRequest = {
  proposalId: string;
  approvalId: string;
  nonce: string;
};
