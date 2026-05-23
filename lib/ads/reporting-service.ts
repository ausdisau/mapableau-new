import { prisma } from "@/lib/prisma";

export async function getCampaignReport(campaignId: string) {
  const rows = await prisma.adMetricsDaily.findMany({
    where: { campaignId },
    orderBy: { date: "desc" },
  });

  const totals = rows.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
    }),
    { impressions: 0, clicks: 0 }
  );

  const ctr =
    totals.impressions > 0
      ? (totals.clicks / totals.impressions) * 100
      : 0;

  return {
    byDay: rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      placement: r.placement,
      regionCode: r.regionCode,
      deviceType: r.deviceType,
      impressions: r.impressions,
      clicks: r.clicks,
    })),
    totals: {
      ...totals,
      ctrPercent: Math.round(ctr * 100) / 100,
    },
  };
}

export async function getAdminAdsSummary() {
  const [pending, active, totalImpressions] = await Promise.all([
    prisma.adCampaign.count({ where: { status: "pending_review" } }),
    prisma.adCampaign.count({ where: { status: "active" } }),
    prisma.adMetricsDaily.aggregate({ _sum: { impressions: true, clicks: true } }),
  ]);

  return {
    pendingReview: pending,
    activeCampaigns: active,
    totalImpressions: totalImpressions._sum.impressions ?? 0,
    totalClicks: totalImpressions._sum.clicks ?? 0,
  };
}
