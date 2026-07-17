import type { NdisClaimApproval, NdisClaimApprovalDecision } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function insertClaimApproval(input: {
  claimSnapshotId: string;
  organisationId: string;
  decision: NdisClaimApprovalDecision;
  payloadHash: string;
  approvedById: string;
  approvedAt?: Date | null;
  expiresAt?: Date | null;
  reason?: string | null;
  approvalContextJson?: object | null;
}): Promise<NdisClaimApproval> {
  return prisma.ndisClaimApproval.create({
    data: {
      claimSnapshotId: input.claimSnapshotId,
      organisationId: input.organisationId,
      decision: input.decision,
      payloadHash: input.payloadHash,
      approvedById: input.approvedById,
      approvedAt: input.approvedAt ?? (input.decision === "approved" ? new Date() : null),
      expiresAt: input.expiresAt ?? undefined,
      reason: input.reason ?? undefined,
      approvalContextJson: input.approvalContextJson ?? undefined,
    },
  });
}

export async function findValidApprovalForSnapshot(params: {
  snapshotId: string;
  organisationId: string;
  payloadHash: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  return prisma.ndisClaimApproval.findFirst({
    where: {
      claimSnapshotId: params.snapshotId,
      organisationId: params.organisationId,
      payloadHash: params.payloadHash,
      decision: "approved",
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { approvedAt: "desc" },
  });
}

export async function revokeApprovalRecord(params: {
  approvalId: string;
  revokedById: string;
  reason: string;
}) {
  return prisma.ndisClaimApproval.update({
    where: { id: params.approvalId },
    data: {
      decision: "revoked",
      revokedAt: new Date(),
      revokedById: params.revokedById,
      reason: params.reason,
    },
  });
}

export async function listApprovalsForSnapshot(snapshotId: string) {
  return prisma.ndisClaimApproval.findMany({
    where: { claimSnapshotId: snapshotId },
    orderBy: { createdAt: "desc" },
  });
}
