import type { AdReviewDecision } from "@/types/ads";
import { adReviewDecisionSchema } from "@/types/ads";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function listCampaignsPendingReview() {
  return prisma.adCampaign.findMany({
    where: {
      OR: [
        { reviewStatus: "pending" },
        { status: "pending_review" },
      ],
    },
    include: {
      creatives: true,
      targetingRules: true,
      advertiserProfile: { include: { organisation: true } },
      reviewEvents: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function approveCampaign(params: {
  campaignId: string;
  reviewerId: string;
  notes?: string;
}) {
  const input = adReviewDecisionSchema.parse({
    decision: "approved",
    notes: params.notes,
  });

  return decideCampaignReview({
    campaignId: params.campaignId,
    reviewerId: params.reviewerId,
    decision: input.decision,
    notes: input.notes,
    nextStatus: "active",
  });
}

export async function rejectCampaign(params: {
  campaignId: string;
  reviewerId: string;
  notes?: string;
}) {
  const input = adReviewDecisionSchema.parse({
    decision: "rejected",
    notes: params.notes,
  });

  return decideCampaignReview({
    campaignId: params.campaignId,
    reviewerId: params.reviewerId,
    decision: input.decision,
    notes: input.notes,
    nextStatus: "rejected",
  });
}

export async function requestCampaignChanges(params: {
  campaignId: string;
  reviewerId: string;
  notes?: string;
}) {
  const input = adReviewDecisionSchema.parse({
    decision: "changes_requested",
    notes: params.notes,
  });

  return decideCampaignReview({
    campaignId: params.campaignId,
    reviewerId: params.reviewerId,
    decision: input.decision,
    notes: input.notes,
    nextStatus: "draft",
  });
}

export async function suspendCampaign(params: {
  campaignId: string;
  reviewerId: string;
  notes?: string;
}) {
  return decideCampaignReview({
    campaignId: params.campaignId,
    reviewerId: params.reviewerId,
    decision: "rejected",
    notes: params.notes,
    nextStatus: "suspended",
  });
}

async function decideCampaignReview(params: {
  campaignId: string;
  reviewerId: string;
  decision: AdReviewDecision;
  notes?: string;
  nextStatus: "active" | "rejected" | "draft" | "suspended";
}) {
  const campaign = await prisma.adCampaign.update({
    where: { id: params.campaignId },
    data: {
      reviewStatus: params.decision,
      status: params.nextStatus,
    },
  });

  await prisma.adReviewEvent.create({
    data: {
      campaignId: params.campaignId,
      reviewerId: params.reviewerId,
      decision: params.decision,
      notes: params.notes,
    },
  });

  await createAuditEvent({
    actorUserId: params.reviewerId,
    action: "ad.review_decided",
    entityType: "AdCampaign",
    entityId: params.campaignId,
    organisationId: campaign.organisationId,
    metadata: { decision: params.decision, nextStatus: params.nextStatus },
  });

  return campaign;
}

export async function submitCampaignForReview(params: {
  campaignId: string;
  actorUserId: string;
}) {
  const campaign = await prisma.adCampaign.update({
    where: { id: params.campaignId },
    data: {
      status: "pending_review",
      reviewStatus: "pending",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "ad.submitted_for_review",
    entityType: "AdCampaign",
    entityId: params.campaignId,
    organisationId: campaign.organisationId,
  });

  return campaign;
}

export async function getCampaignReports(campaignId: string) {
  return prisma.adUserAction.findMany({
    where: { campaignId, actionType: "reported" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
