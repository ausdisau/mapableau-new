import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { safeEqualHex } from "@/lib/crypto/ndis";
import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";
import {
  allowsRegisteredProviderDirectClaim,
  isFundingRoute,
  type FundingRoute,
} from "@/lib/ndis-gateway/domain/funding-route";
import {
  findValidApprovalForSnapshot,
  insertClaimApproval,
  listApprovalsForSnapshot,
  revokeApprovalRecord,
} from "@/lib/ndis-gateway/infrastructure/claim-approval-repository";
import { findClaimSnapshotById } from "@/lib/ndis-gateway/infrastructure/claim-snapshot-repository";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

const DEFAULT_APPROVAL_TTL_MS = 24 * 60 * 60 * 1000;

async function assertOrgAccess(user: CurrentUser, organisationId: string) {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new NdisGatewayError({
      code: "FUNDING_ROUTE_BLOCKED",
      plainLanguageMessage: "You do not have access to this organisation.",
      technicalMessage: "FORBIDDEN organisation access for claim approval",
    });
  }
}

function canApproveClaims(user: CurrentUser): boolean {
  return (
    hasPermission(user.primaryRole, "provider:ndis:claim:approve") ||
    hasPermission(user.primaryRole, "provider:ndia:claim") ||
    hasPermission(user.primaryRole, "provider:ndis:claim") ||
    isAdminRole(user.primaryRole)
  );
}

function canRevokeApprovals(user: CurrentUser): boolean {
  return (
    hasPermission(user.primaryRole, "provider:ndis:claim:revoke") ||
    hasPermission(user.primaryRole, "provider:ndia:claim") ||
    isAdminRole(user.primaryRole)
  );
}

export async function approveClaimSnapshot(params: {
  user: CurrentUser;
  snapshotId: string;
  reason?: string | null;
  expiresAt?: Date | null;
  requireSeparateApprover?: boolean;
}) {
  if (!canApproveClaims(params.user)) {
    throw new NdisGatewayError({
      code: "FUNDING_ROUTE_BLOCKED",
      plainLanguageMessage: "You are not permitted to approve claims.",
      technicalMessage: "FORBIDDEN approve claim",
    });
  }

  const snapshot = await findClaimSnapshotById(params.snapshotId);
  if (!snapshot) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "Claim snapshot not found.",
      technicalMessage: "NOT_FOUND snapshot approve",
    });
  }

  await assertOrgAccess(params.user, snapshot.organisationId);

  if (snapshot.supersededAt) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "A superseded claim snapshot cannot be approved.",
      technicalMessage: "SUPERSEDED snapshot approve",
    });
  }

  const fundingRoute: FundingRoute = isFundingRoute(snapshot.fundingRoute ?? "")
    ? (snapshot.fundingRoute as FundingRoute)
    : "unknown";
  if (!allowsRegisteredProviderDirectClaim(fundingRoute)) {
    throw new NdisGatewayError({
      code: "FUNDING_ROUTE_BLOCKED",
      plainLanguageMessage:
        "Only NDIA-managed claims can receive direct-submission approval.",
      technicalMessage: `Approval blocked for fundingRoute=${fundingRoute}`,
    });
  }

  const org = await prisma.organisation.findUnique({
    where: { id: snapshot.organisationId },
  });
  if (!org?.ndisRegistrationClaimed || !org.ndisRegistrationNumber) {
    throw new NdisGatewayError({
      code: "PROVIDER_NOT_REGISTERED",
      plainLanguageMessage:
        "Organisation must be a registered NDIS provider before approval.",
      technicalMessage: "Unregistered org approval attempt",
    });
  }

  if (
    params.requireSeparateApprover !== false &&
    snapshot.createdById === params.user.id &&
    !isAdminRole(params.user.primaryRole)
  ) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage:
        "The person who created this claim cannot also approve it for live submission.",
      technicalMessage: "CREATOR_APPROVER_SAME",
    });
  }

  const expiresAt =
    params.expiresAt ?? new Date(Date.now() + DEFAULT_APPROVAL_TTL_MS);

  const approval = await insertClaimApproval({
    claimSnapshotId: snapshot.id,
    organisationId: snapshot.organisationId,
    decision: "approved",
    payloadHash: snapshot.payloadHash,
    approvedById: params.user.id,
    approvedAt: new Date(),
    expiresAt,
    reason: params.reason,
    approvalContextJson: {
      fundingRoute,
      registrationNumber: org.ndisRegistrationNumber,
    },
  });

  await createAuditEvent({
    actorUserId: params.user.id,
    action: "ndis.claim_approval.approved",
    entityType: "NdisClaimApproval",
    entityId: approval.id,
    organisationId: snapshot.organisationId,
    participantId: snapshot.participantId,
    metadata: sanitiseAuditJson({
      snapshotId: snapshot.id,
      payloadHash: snapshot.payloadHash,
      expiresAt: expiresAt.toISOString(),
      reason: params.reason ?? null,
    }),
  });

  return approval;
}

export async function rejectClaimSnapshot(params: {
  user: CurrentUser;
  snapshotId: string;
  reason: string;
}) {
  if (!canApproveClaims(params.user)) {
    throw new NdisGatewayError({
      code: "FUNDING_ROUTE_BLOCKED",
      plainLanguageMessage: "You are not permitted to reject claims.",
      technicalMessage: "FORBIDDEN reject claim",
    });
  }
  if (!params.reason?.trim()) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "A reason is required when rejecting a claim.",
      technicalMessage: "REASON_REQUIRED reject",
    });
  }

  const snapshot = await findClaimSnapshotById(params.snapshotId);
  if (!snapshot) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "Claim snapshot not found.",
      technicalMessage: "NOT_FOUND snapshot reject",
    });
  }
  await assertOrgAccess(params.user, snapshot.organisationId);

  const approval = await insertClaimApproval({
    claimSnapshotId: snapshot.id,
    organisationId: snapshot.organisationId,
    decision: "rejected",
    payloadHash: snapshot.payloadHash,
    approvedById: params.user.id,
    approvedAt: new Date(),
    reason: params.reason,
  });

  await createAuditEvent({
    actorUserId: params.user.id,
    action: "ndis.claim_approval.rejected",
    entityType: "NdisClaimApproval",
    entityId: approval.id,
    organisationId: snapshot.organisationId,
    participantId: snapshot.participantId,
    metadata: sanitiseAuditJson({
      snapshotId: snapshot.id,
      payloadHash: snapshot.payloadHash,
      reason: params.reason,
    }),
  });

  return approval;
}

export type SubmissionApprovalCandidate = {
  id: string;
  claimSnapshotId: string;
  organisationId: string;
  decision: string;
  payloadHash: string;
  revokedAt: Date | null;
  expiresAt: Date | null;
};

export type SubmissionSnapshotCandidate = {
  id: string;
  organisationId: string;
  payloadHash: string;
  supersededAt: Date | null;
};

/**
 * Pure approval gate used by getSubmissionApproval and unit tests.
 * Never consults NdiaPilotApprovalRecord.
 */
export function evaluateSubmissionApproval(params: {
  snapshot: SubmissionSnapshotCandidate | null;
  approval: SubmissionApprovalCandidate | null;
  now?: Date;
}): "ok" | "missing" | "superseded" | "org_mismatch" | "hash_mismatch" | "not_approved" | "revoked" | "expired" {
  const { snapshot, approval } = params;
  if (!snapshot || !approval) return "missing";
  if (snapshot.supersededAt) return "superseded";
  if (approval.claimSnapshotId !== snapshot.id) return "missing";
  if (approval.organisationId !== snapshot.organisationId) return "org_mismatch";
  if (!safeEqualHex(approval.payloadHash, snapshot.payloadHash)) {
    return "hash_mismatch";
  }
  if (approval.decision !== "approved") return "not_approved";
  if (approval.revokedAt) return "revoked";
  const now = params.now ?? new Date();
  if (approval.expiresAt && approval.expiresAt.getTime() <= now.getTime()) {
    return "expired";
  }
  return "ok";
}

/**
 * Returns a valid approval only when decision, org, payload hash, expiry,
 * revocation and snapshot supersession all match. Never uses pilot records.
 */
export async function getSubmissionApproval(snapshotId: string) {
  const snapshot = await findClaimSnapshotById(snapshotId);
  if (!snapshot) return null;

  const approval = await findValidApprovalForSnapshot({
    snapshotId: snapshot.id,
    organisationId: snapshot.organisationId,
    payloadHash: snapshot.payloadHash,
  });

  const decision = evaluateSubmissionApproval({ snapshot, approval });
  if (decision !== "ok" || !approval) return null;

  return { approval, snapshot };
}

export async function revokeClaimApproval(params: {
  user: CurrentUser;
  approvalId: string;
  reason: string;
}) {
  if (!canRevokeApprovals(params.user)) {
    throw new NdisGatewayError({
      code: "FUNDING_ROUTE_BLOCKED",
      plainLanguageMessage: "You are not permitted to revoke claim approvals.",
      technicalMessage: "FORBIDDEN revoke approval",
    });
  }
  if (!params.reason?.trim()) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "A reason is required when revoking an approval.",
      technicalMessage: "REASON_REQUIRED revoke",
    });
  }

  const existing = await prisma.ndisClaimApproval.findUnique({
    where: { id: params.approvalId },
  });
  if (!existing) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "Approval not found.",
      technicalMessage: "NOT_FOUND approval",
    });
  }
  await assertOrgAccess(params.user, existing.organisationId);

  const revoked = await revokeApprovalRecord({
    approvalId: params.approvalId,
    revokedById: params.user.id,
    reason: params.reason,
  });

  await createAuditEvent({
    actorUserId: params.user.id,
    action: "ndis.claim_approval.revoked",
    entityType: "NdisClaimApproval",
    entityId: revoked.id,
    organisationId: existing.organisationId,
    metadata: sanitiseAuditJson({
      snapshotId: existing.claimSnapshotId,
      payloadHash: existing.payloadHash,
      reason: params.reason,
    }),
  });

  return revoked;
}

export async function getSnapshotApprovals(
  snapshotId: string,
  user: CurrentUser
) {
  const snapshot = await findClaimSnapshotById(snapshotId);
  if (!snapshot) {
    throw new NdisGatewayError({
      code: "UNSUPPORTED_OPERATION",
      plainLanguageMessage: "Claim snapshot not found.",
      technicalMessage: "NOT_FOUND snapshot approvals",
    });
  }
  await assertOrgAccess(user, snapshot.organisationId);
  return listApprovalsForSnapshot(snapshotId);
}

/**
 * Explicitly documents that NdiaPilotApprovalRecord is not claim authority.
 */
export function pilotApprovalIsNotClaimAuthority(): true {
  return true;
}
