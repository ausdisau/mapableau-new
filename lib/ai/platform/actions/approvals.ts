import { randomUUID } from "node:crypto";

import {
  buildIdempotencyKey,
  hashActionPayload,
  hashInformationToShare,
} from "./envelope";
import { evaluateActionPolicy } from "./policy";
import { getMapAbleActionDefinition } from "./registry";
import { validateActionPayload } from "./schemas";
import {
  getActionProposal,
  saveActionProposal,
  saveApprovalBinding,
  updateActionProposal,
} from "./store";
import type {
  ApprovalBinding,
  MapAbleActionKey,
  MapAbleActionProposal,
} from "./types";

export type CreateProposalInput = {
  missionId: string;
  traceId: string;
  actionKey: MapAbleActionKey;
  participantId: string;
  actorId: string;
  payload: Record<string, unknown>;
  informationToShare: string[];
  purpose: string;
  consentScopes: string[];
  missionProposalId?: string | null;
  expiresInHours?: number;
};

export function createActionProposal(
  input: CreateProposalInput,
): MapAbleActionProposal {
  const validatedPayload = validateActionPayload(input.actionKey, input.payload);
  const payloadHash = hashActionPayload(validatedPayload);

  const policy = evaluateActionPolicy({
    actionKey: input.actionKey,
    payload: validatedPayload,
    consentScopes: input.consentScopes,
  });
  if (!policy.allowed) {
    throw new Error(policy.reasonCode ?? "ACTION_POLICY_DENIED");
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (input.expiresInHours ?? 24) * 60 * 60 * 1000,
  );

  const proposal: MapAbleActionProposal = {
    proposalId: randomUUID(),
    missionId: input.missionId,
    traceId: input.traceId,
    actionKey: input.actionKey,
    participantId: input.participantId,
    actorId: input.actorId,
    payload: validatedPayload,
    payloadHash,
    informationToShare: input.informationToShare,
    purpose: input.purpose,
    consentScopes: input.consentScopes,
    status: "proposed",
    missionProposalId: input.missionProposalId ?? null,
    idempotencyKey: hashActionPayload({
      missionId: input.missionId,
      actionKey: input.actionKey,
      payloadHash,
    }),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  saveActionProposal(proposal);
  return proposal;
}

export type ApproveProposalInput = {
  proposalId: string;
  actorId: string;
  actorType: "participant" | "authorised_human";
  consentScopes: string[];
  confirmedInformationToShare: string[];
};

export function approveActionProposal(
  input: ApproveProposalInput,
): ApprovalBinding {
  const proposal = getActionProposal(input.proposalId);
  if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
  if (proposal.participantId !== input.actorId && input.actorType === "participant") {
    throw new Error("PARTICIPANT_MISMATCH");
  }

  const policy = evaluateActionPolicy({
    actionKey: proposal.actionKey,
    payload: proposal.payload,
    consentScopes: input.consentScopes,
    proposal,
  });
  if (!policy.allowed) {
    throw new Error(policy.reasonCode ?? "APPROVAL_POLICY_DENIED");
  }

  const definition = getMapAbleActionDefinition(proposal.actionKey);
  for (const scope of definition.requiredConsentScopes) {
    if (!input.consentScopes.includes(scope)) {
      throw new Error("MISSING_CONSENT");
    }
  }

  const nonce = randomUUID();
  const approvedInformationToShareHash = hashInformationToShare(
    input.confirmedInformationToShare,
  );
  const expiresAt = proposal.expiresAt;

  const binding: ApprovalBinding = {
    approvalId: randomUUID(),
    proposalId: proposal.proposalId,
    payloadHash: proposal.payloadHash,
    nonce,
    consentScopes: input.consentScopes,
    approvedInformationToShareHash,
    actorId: input.actorId,
    actorType: input.actorType,
    approvedAt: new Date().toISOString(),
    expiresAt,
  };

  saveApprovalBinding(binding);
  updateActionProposal(proposal.proposalId, {
    status: "approved",
    consentScopes: input.consentScopes,
  });

  return binding;
}

export function rejectActionProposal(input: {
  proposalId: string;
  actorId: string;
}): MapAbleActionProposal {
  const proposal = getActionProposal(input.proposalId);
  if (!proposal) throw new Error("PROPOSAL_NOT_FOUND");
  if (proposal.participantId !== input.actorId) {
    throw new Error("PARTICIPANT_MISMATCH");
  }
  const updated = updateActionProposal(input.proposalId, { status: "rejected" });
  if (!updated) throw new Error("PROPOSAL_NOT_FOUND");
  return updated;
}

export function buildExecutionIdempotencyKey(
  binding: ApprovalBinding,
): string {
  return buildIdempotencyKey({
    proposalId: binding.proposalId,
    approvalId: binding.approvalId,
    nonce: binding.nonce,
  });
}
