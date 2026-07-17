import type { AccountabilityPublicationStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { hashPublicationPackage } from "@/lib/accountability/snapshot-hash";
import type { PublicationWorkflowStage } from "@/lib/accountability/types";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export class AccountabilityWorkflowError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AccountabilityWorkflowError";
  }
}

const APPROVAL_STAGES: PublicationWorkflowStage[] = [
  "privacy_review",
  "safeguarding_review",
  "approve",
  "publish",
];

export async function preparePublicationSnapshot(params: {
  title: string;
  reportingPeriodStart: Date;
  reportingPeriodEnd: Date;
  preparedById: string;
  packageJson: Record<string, unknown>;
  dataCompletenessPct?: number;
  isDemonstration?: boolean;
  previousSnapshotHash?: string | null;
}) {
  const contentSha256 = hashPublicationPackage(params.packageJson);

  const snapshot = await prisma.accountabilityPublicationSnapshot.create({
    data: {
      title: params.title,
      reportingPeriodStart: params.reportingPeriodStart,
      reportingPeriodEnd: params.reportingPeriodEnd,
      status: "draft",
      packageJson: params.packageJson as Prisma.InputJsonValue,
      contentSha256,
      previousSnapshotHash: params.previousSnapshotHash ?? null,
      dataCompletenessPct: params.dataCompletenessPct ?? null,
      preparedById: params.preparedById,
      isDemonstration: params.isDemonstration ?? false,
    },
  });

  await prisma.accountabilityPublicationApproval.create({
    data: {
      snapshotId: snapshot.id,
      stage: "prepare",
      decision: "prepared",
      actorUserId: params.preparedById,
      comments: "Snapshot prepared for review",
    },
  });

  await createAuditEvent({
    actorUserId: params.preparedById,
    action: "accountability.snapshot_prepared",
    entityType: "AccountabilityPublicationSnapshot",
    entityId: snapshot.id,
    metadata: { publicId: snapshot.publicId, contentSha256 },
  });

  return snapshot;
}

export async function recordPublicationReview(params: {
  snapshotId: string;
  stage: Exclude<PublicationWorkflowStage, "prepare" | "publish">;
  decision: "approved" | "rejected" | "changes_requested";
  actorUserId: string;
  comments?: string;
}) {
  const snapshot = await prisma.accountabilityPublicationSnapshot.findUnique({
    where: { id: params.snapshotId },
  });
  if (!snapshot) {
    throw new AccountabilityWorkflowError("Snapshot not found", "NOT_FOUND");
  }
  if (snapshot.preparedById === params.actorUserId && params.stage === "approve") {
    throw new AccountabilityWorkflowError(
      "Separation of duties: the preparer cannot approve this snapshot",
      "SOD_VIOLATION"
    );
  }

  await prisma.accountabilityPublicationApproval.create({
    data: {
      snapshotId: params.snapshotId,
      stage: params.stage,
      decision: params.decision,
      actorUserId: params.actorUserId,
      comments: params.comments,
    },
  });

  let nextStatus: AccountabilityPublicationStatus = snapshot.status;
  if (params.decision === "approved") {
    if (params.stage === "privacy_review") nextStatus = "quality_review";
    else if (params.stage === "safeguarding_review") nextStatus = "approval_required";
    else if (params.stage === "approve") nextStatus = "approved";
  } else if (params.decision === "rejected" || params.decision === "changes_requested") {
    nextStatus = "draft";
  }

  const updated = await prisma.accountabilityPublicationSnapshot.update({
    where: { id: params.snapshotId },
    data: { status: nextStatus },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: `accountability.review_${params.stage}`,
    entityType: "AccountabilityPublicationSnapshot",
    entityId: snapshot.id,
    metadata: { decision: params.decision, nextStatus },
  });

  return updated;
}

export async function publishApprovedSnapshot(params: {
  snapshotId: string;
  actorUserId: string;
  comments?: string;
}) {
  const snapshot = await prisma.accountabilityPublicationSnapshot.findUnique({
    where: { id: params.snapshotId },
    include: { approvals: true },
  });
  if (!snapshot) {
    throw new AccountabilityWorkflowError("Snapshot not found", "NOT_FOUND");
  }
  if (snapshot.status !== "approved") {
    throw new AccountabilityWorkflowError(
      "Snapshot must be approved before publication",
      "NOT_APPROVED"
    );
  }
  if (snapshot.preparedById === params.actorUserId) {
    throw new AccountabilityWorkflowError(
      "Separation of duties: the preparer cannot publish this snapshot",
      "SOD_VIOLATION"
    );
  }

  const hasApproval = snapshot.approvals.some(
    (a) => a.stage === "approve" && a.decision === "approved"
  );
  if (!hasApproval) {
    throw new AccountabilityWorkflowError(
      "Independent approval record required before publication",
      "MISSING_APPROVAL"
    );
  }

  const packageJson = snapshot.packageJson as Record<string, unknown>;
  const contentSha256 = hashPublicationPackage(packageJson);

  const published = await prisma.accountabilityPublicationSnapshot.update({
    where: { id: params.snapshotId },
    data: {
      status: "published",
      publishedAt: new Date(),
      contentSha256,
    },
  });

  await prisma.accountabilityPublicationApproval.create({
    data: {
      snapshotId: params.snapshotId,
      stage: "publish",
      decision: "published",
      actorUserId: params.actorUserId,
      comments: params.comments,
    },
  });

  await prisma.accountabilityMetricValue.updateMany({
    where: { snapshotId: params.snapshotId },
    data: { status: "published" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "accountability.snapshot_published",
    entityType: "AccountabilityPublicationSnapshot",
    entityId: snapshot.id,
    metadata: { publicId: snapshot.publicId, contentSha256 },
  });

  return published;
}

export function assertSeparationOfDuties(
  preparedById: string | null | undefined,
  actorUserId: string,
  stage: PublicationWorkflowStage
): void {
  if (
    preparedById &&
    preparedById === actorUserId &&
    (stage === "approve" || stage === "publish")
  ) {
    throw new AccountabilityWorkflowError(
      "Separation of duties violated",
      "SOD_VIOLATION"
    );
  }
}

export { APPROVAL_STAGES };
