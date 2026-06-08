import type { AdModerationDecision } from "@prisma/client";

import { activateApprovedCampaigns } from "@/lib/ads/campaign-service";
import { validateCampaignForSubmit } from "@/lib/ads/policy-validation";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function listCampaignsPendingReview() {
  return prisma.adCampaign.findMany({
    where: { status: "pending_review" },
    include: {
      advertiser: { include: { organisation: true } },
      creatives: true,
      billingInvoice: true,
      reviews: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { submittedAt: "asc" },
  });
}

export async function moderateCampaign(
  reviewerId: string,
  campaignId: string,
  input: { decision: AdModerationDecision; notes?: string }
) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    include: {
      advertiser: true,
      creatives: true,
      billingInvoice: true,
    },
  });

  if (!campaign) return { ok: false as const, error: "Campaign not found." };
  if (campaign.status !== "pending_review") {
    return {
      ok: false as const,
      error: "Campaign is not pending review.",
    };
  }
  if (campaign.billingInvoice?.status !== "paid") {
    return {
      ok: false as const,
      error: "Campaign must be paid before approval.",
    };
  }

  const policy = validateCampaignForSubmit({
    name: campaign.name,
    creatives: campaign.creatives,
    targeting: campaign.targeting,
    category: campaign.advertiser.category,
  });

  if (input.decision === "approved" && !policy.passed) {
    return {
      ok: false as const,
      error: `Policy check failed: ${policy.violations.join(" ")}`,
    };
  }

  const newStatus =
    input.decision === "approved" ? "approved" : "rejected";

  await prisma.adModerationReview.create({
    data: {
      campaignId,
      decision: input.decision,
      notes: input.notes,
      reviewerId,
      policyFlags: policy.violations.length ? policy.violations : undefined,
      reviewedAt: new Date(),
    },
  });

  const updated = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: { status: newStatus },
    include: { creatives: true, advertiser: { include: { organisation: true } } },
  });

  await createAuditEvent({
    actorUserId: reviewerId,
    action: `ad_campaign.${input.decision}`,
    entityType: "AdCampaign",
    entityId: campaignId,
    metadata: { notes: input.notes },
  });

  if (input.decision === "approved") {
    await activateApprovedCampaigns();
  }

  return { ok: true as const, campaign: updated };
}
