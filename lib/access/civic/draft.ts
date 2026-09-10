/**
 * Civic issue draft lifecycle — refuses autonomous Open311 submit.
 */

import { randomUUID } from "crypto";

import { openInfrastructureFlags } from "@/lib/integrations/access/flags";

import {
  civicAccessIssueSchema,
  civicIssueDraftInputSchema,
  civicSubmissionConfirmSchema,
  type CivicAccessIssue,
  type CivicIssueDraftInput,
  type CivicSubmissionConfirm,
} from "./types";

export class CivicAccessError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "CivicAccessError";
    this.status = status;
  }
}

const drafts = new Map<string, CivicAccessIssue>();

export function __resetCivicDraftsForTests(): void {
  drafts.clear();
}

export function createCivicIssueDraft(raw: unknown): CivicAccessIssue {
  if (!openInfrastructureFlags.open311) {
    throw new CivicAccessError("Open311 civic bridge is disabled", 404);
  }
  const input = civicIssueDraftInputSchema.parse(raw);
  const now = new Date().toISOString();
  const draftId = randomUUID();
  const confirmationToken = randomUUID();
  const issue = civicAccessIssueSchema.parse({
    id: randomUUID(),
    draftId,
    status: "draft",
    serviceCode: input.serviceCode,
    description: input.description,
    lat: input.lat,
    lng: input.lng,
    placeId: input.placeId,
    evidenceObjectIds: input.evidenceObjectIds,
    createdAt: now,
    updatedAt: now,
    actorRef: input.actorRef,
    confirmationToken,
  });
  drafts.set(draftId, issue);
  return issue;
}

export function getCivicIssueDraft(draftId: string): CivicAccessIssue | undefined {
  return drafts.get(draftId);
}

/**
 * Submit only after explicit human confirmation — never autonomous.
 */
export function confirmCivicSubmission(raw: unknown): CivicAccessIssue {
  if (!openInfrastructureFlags.open311) {
    throw new CivicAccessError("Open311 civic bridge is disabled", 404);
  }
  const confirm = civicSubmissionConfirmSchema.parse(raw);
  if (!confirm.humanConfirmed) {
    throw new CivicAccessError(
      "Autonomous civic submission is not permitted",
      403,
    );
  }
  const draft = drafts.get(confirm.draftId);
  if (!draft) {
    throw new CivicAccessError("Draft not found", 404);
  }
  if (draft.confirmationToken !== confirm.confirmationToken) {
    throw new CivicAccessError("Invalid confirmation token", 403);
  }
  if (draft.actorRef !== confirm.actorRef) {
    throw new CivicAccessError("Actor mismatch", 403);
  }
  if (draft.status !== "draft" && draft.status !== "pending_confirmation") {
    throw new CivicAccessError(`Draft already ${draft.status}`, 409);
  }

  const now = new Date().toISOString();
  const submitted = civicAccessIssueSchema.parse({
    ...draft,
    status: "submitted",
    updatedAt: now,
    submittedAt: now,
    confirmationToken: undefined,
  });
  drafts.set(confirm.draftId, submitted);
  return submitted;
}

/**
 * External RESOLVED does NOT auto-restore access — needs community verification.
 */
export function applyExternalResolutionFeedback(
  draftId: string,
  externalServiceRequestId: string,
): CivicAccessIssue {
  const draft = drafts.get(draftId);
  if (!draft) {
    throw new CivicAccessError("Draft not found", 404);
  }
  const now = new Date().toISOString();
  const updated = civicAccessIssueSchema.parse({
    ...draft,
    status: "needs_community_verification",
    externalServiceRequestId,
    resolvedAt: now,
    updatedAt: now,
  });
  drafts.set(draftId, updated);
  return updated;
}
