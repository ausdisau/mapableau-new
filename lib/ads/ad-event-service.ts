import type { AdEventType, AdPlacementSurface } from "@/types/ads";
import { adEventPayloadSchema, adUserActionSchema } from "@/types/ads";

import { prisma } from "@/lib/prisma";

const REDACTED_METADATA_KEYS = [
  "diagnosis",
  "clinical",
  "ndis_plan",
  "incident",
  "safeguard",
  "message",
  "address",
];

function sanitizeMetadata(
  metadata?: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> | undefined {
  if (!metadata) return undefined;
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (REDACTED_METADATA_KEYS.some((k) => lower.includes(k))) continue;
    safe[key] = value;
  }
  return Object.keys(safe).length > 0 ? safe : undefined;
}

export async function recordAdEvent(params: {
  campaignId: string;
  creativeId?: string;
  eventType: AdEventType;
  placementSurface?: AdPlacementSurface;
  sessionToken?: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  const parsed = adEventPayloadSchema.parse({
    campaignId: params.campaignId,
    creativeId: params.creativeId,
    eventType: params.eventType,
    placementSurface: params.placementSurface,
    sessionToken: params.sessionToken,
    metadata: params.metadata,
  });

  await prisma.adEvent.create({
    data: {
      campaignId: parsed.campaignId,
      creativeId: parsed.creativeId,
      eventType: parsed.eventType,
      placementSurface: parsed.placementSurface,
      sessionToken: parsed.sessionToken,
      userId: params.userId,
      metadata: sanitizeMetadata(parsed.metadata),
    },
  });

  if (parsed.eventType === "impression" || parsed.eventType === "click") {
    await maybeRecordBudgetSpend(parsed.campaignId, parsed.eventType);
  }
}

async function maybeRecordBudgetSpend(
  campaignId: string,
  eventType: AdEventType,
) {
  const campaign = await prisma.adCampaign.findUnique({
    where: { id: campaignId },
    select: { bidAmountCents: true, spentBudgetCents: true, totalBudgetCents: true },
  });
  if (!campaign) return;

  const cost =
    eventType === "click"
      ? Math.max(campaign.bidAmountCents, 1)
      : Math.max(Math.floor(campaign.bidAmountCents / 10), 0);
  if (cost <= 0) return;
  if (campaign.spentBudgetCents + cost > campaign.totalBudgetCents) return;

  await prisma.$transaction([
    prisma.adBudgetEvent.create({
      data: {
        campaignId,
        eventType: "spend",
        amountCents: cost,
        metadata: { trigger: eventType },
      },
    }),
    prisma.adCampaign.update({
      where: { id: campaignId },
      data: { spentBudgetCents: { increment: cost } },
    }),
  ]);
}

export async function recordAdUserAction(params: {
  campaignId: string;
  actionType: "hidden" | "reported";
  sessionToken?: string;
  userId?: string;
  reason?: string;
}) {
  const parsed = adUserActionSchema.parse(params);

  await prisma.adUserAction.create({
    data: {
      campaignId: parsed.campaignId,
      actionType: parsed.actionType,
      sessionToken: parsed.sessionToken,
      userId: params.userId,
      reason: parsed.reason,
    },
  });

  const eventType: AdEventType =
    parsed.actionType === "hidden" ? "dismissed" : "reported";
  await recordAdEvent({
    campaignId: parsed.campaignId,
    eventType,
    sessionToken: parsed.sessionToken,
    userId: params.userId,
    metadata: parsed.reason ? { reasonLength: parsed.reason.length } : undefined,
  });
}

export async function getCampaignFatiguePenalty(
  campaignId: string,
  sessionToken?: string,
): Promise<number> {
  if (!sessionToken) return 0;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const impressions = await prisma.adEvent.count({
    where: {
      campaignId,
      sessionToken,
      eventType: "impression",
      createdAt: { gte: since },
    },
  });
  return Math.min(impressions * 0.05, 0.4);
}

export async function getCampaignReportPenalty(campaignId: string): Promise<number> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const reports = await prisma.adEvent.count({
    where: {
      campaignId,
      eventType: "reported",
      createdAt: { gte: since },
    },
  });
  return Math.min(reports * 0.1, 0.5);
}

export async function isCampaignHiddenByUser(
  campaignId: string,
  sessionToken?: string,
  userId?: string,
): Promise<boolean> {
  if (!sessionToken && !userId) return false;
  const hidden = await prisma.adUserAction.findFirst({
    where: {
      campaignId,
      actionType: "hidden",
      OR: [
        sessionToken ? { sessionToken } : {},
        userId ? { userId } : {},
      ].filter((clause) => Object.keys(clause).length > 0),
    },
  });
  return Boolean(hidden);
}
