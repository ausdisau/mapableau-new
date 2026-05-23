import type { AdPlacement } from "@prisma/client";
import { startOfDay } from "date-fns";

import { getActiveCampaignForTracking } from "@/lib/ads/serve-service";
import { prisma } from "@/lib/prisma";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function trackAdEvent(input: {
  campaignId: string;
  placement: AdPlacement;
  type: "impression" | "click";
  regionCode?: string;
  deviceType?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const rateKey = `track:${input.campaignId}:${input.placement}`;
  if (!checkRateLimit(rateKey)) {
    return { ok: false, error: "Rate limit exceeded" };
  }

  const campaign = await getActiveCampaignForTracking(input.campaignId);
  if (!campaign) {
    return { ok: false, error: "Campaign not active" };
  }

  const date = startOfDay(new Date());
  const regionCode = (input.regionCode ?? "AU").slice(0, 10);
  const deviceType = (input.deviceType ?? "unknown").slice(0, 20);

  const field =
    input.type === "impression" ? "impressions" : "clicks";

  await prisma.adMetricsDaily.upsert({
    where: {
      campaignId_date_placement_regionCode_deviceType: {
        campaignId: input.campaignId,
        date,
        placement: input.placement,
        regionCode,
        deviceType,
      },
    },
    create: {
      campaignId: input.campaignId,
      date,
      placement: input.placement,
      regionCode,
      deviceType,
      impressions: field === "impressions" ? 1 : 0,
      clicks: field === "clicks" ? 1 : 0,
    },
    update: {
      [field]: { increment: 1 },
    },
  });

  if (input.type === "impression") {
    await prisma.adCampaign.update({
      where: { id: input.campaignId },
      data: { spentCents: { increment: 1 } },
    });
  }

  if (campaign.spentCents + 1 >= campaign.budgetCents && input.type === "impression") {
    await prisma.adCampaign.update({
      where: { id: campaign.id },
      data: { status: "ended" },
    });
  }

  return { ok: true };
}
