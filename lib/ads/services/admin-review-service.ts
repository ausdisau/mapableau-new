import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export async function listPendingReviews() {
  return prisma.adCreative.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" },
    take: 100,
    include: {
      campaign: { include: { advertiser: true } },
      policyReviews: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
}

export async function approveCreative(
  admin: CurrentUser,
  creativeId: string,
  notes?: string,
) {
  const creative = await prisma.adCreative.findUnique({
    where: { id: creativeId },
    include: { campaign: true },
  });
  if (!creative) throw new Error("NOT_FOUND");
  if (creative.status !== "PENDING_REVIEW") {
    throw new Error("INVALID_STATUS");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.adCreative.update({
      where: { id: creativeId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      },
    });
    await tx.adCampaign.update({
      where: { id: creative.campaignId },
      data: {
        status:
          creative.campaign.status === "PENDING_REVIEW"
            ? "APPROVED"
            : creative.campaign.status,
      },
    });
    await tx.adPolicyReview.create({
      data: {
        creativeId,
        status: "APPROVED",
        notes: notes ?? "Approved by MapAble admin",
        reviewerId: admin.id,
        claimFlags: creative.claimFlags,
      },
    });
    return c;
  });

  await createAuditEvent({
    actorUserId: admin.id,
    actorRole: admin.primaryRole,
    action: "ads.creative.approved",
    entityType: "AdCreative",
    entityId: creativeId,
    metadata: { notes },
  });

  return updated;
}

export async function rejectCreative(
  admin: CurrentUser,
  creativeId: string,
  notes: string,
) {
  const creative = await prisma.adCreative.findUnique({
    where: { id: creativeId },
    include: { campaign: true },
  });
  if (!creative) throw new Error("NOT_FOUND");
  if (creative.status !== "PENDING_REVIEW") {
    throw new Error("INVALID_STATUS");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.adCreative.update({
      where: { id: creativeId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      },
    });
    await tx.adCampaign.update({
      where: { id: creative.campaignId },
      data: { status: "REJECTED" },
    });
    await tx.adPolicyReview.create({
      data: {
        creativeId,
        status: "REJECTED",
        notes,
        reviewerId: admin.id,
        claimFlags: creative.claimFlags,
      },
    });
    return c;
  });

  await createAuditEvent({
    actorUserId: admin.id,
    actorRole: admin.primaryRole,
    action: "ads.creative.rejected",
    entityType: "AdCreative",
    entityId: creativeId,
    metadata: { notes },
  });

  return updated;
}

/** APPROVED → ACTIVE. Does not enable public serving without ads flags. */
export async function activateCreative(
  admin: CurrentUser,
  creativeId: string,
) {
  const creative = await prisma.adCreative.findUnique({
    where: { id: creativeId },
    include: { campaign: true },
  });
  if (!creative) throw new Error("NOT_FOUND");
  if (creative.status !== "APPROVED") {
    throw new Error("INVALID_STATUS");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.adCreative.update({
      where: { id: creativeId },
      data: { status: "ACTIVE" },
    });
    await tx.adCampaign.update({
      where: { id: creative.campaignId },
      data: { status: "ACTIVE" },
    });
    await tx.adAdvertiser.update({
      where: { id: creative.campaign.advertiserId },
      data: { status: "ACTIVE" },
    });
    return c;
  });

  await createAuditEvent({
    actorUserId: admin.id,
    actorRole: admin.primaryRole,
    action: "ads.creative.activated",
    entityType: "AdCreative",
    entityId: creativeId,
  });

  return updated;
}

export async function pauseAdvertiser(
  admin: CurrentUser,
  advertiserId: string,
) {
  const advertiser = await prisma.adAdvertiser.update({
    where: { id: advertiserId },
    data: { status: "PAUSED" },
  });
  await prisma.adCampaign.updateMany({
    where: { advertiserId, status: "ACTIVE" },
    data: { status: "PAUSED" },
  });

  await createAuditEvent({
    actorUserId: admin.id,
    actorRole: admin.primaryRole,
    action: "ads.advertiser.paused",
    entityType: "AdAdvertiser",
    entityId: advertiserId,
  });

  return advertiser;
}
