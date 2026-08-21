import { listAdvertisersForUser } from "@/lib/ads/auth/advertiser-access";
import { getOrCreateAdWallet } from "@/lib/ads/billing/wallet";
import { microsToString } from "@/lib/ads/money/micros";
import { jsonOk } from "@/lib/api/response";
import { apiUnauthorized, getApiUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/ads/manager — advertiser dashboard snapshot (org-scoped).
 */
export async function GET() {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  const advertisers = await listAdvertisersForUser(user);
  const snapshots = [];

  for (const advertiser of advertisers) {
    const wallet = await getOrCreateAdWallet({ advertiserId: advertiser.id });
    const campaigns = await prisma.adCampaign.findMany({
      where: { advertiserId: advertiser.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    snapshots.push({
      advertiser: {
        id: advertiser.id,
        name: advertiser.name,
        status: advertiser.status,
        organisationId: advertiser.organisationId,
      },
      wallet: {
        id: wallet.id,
        currency: wallet.currency,
        status: wallet.status,
        availableMicros: microsToString(wallet.availableMicros),
      },
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        bidModel: c.bidModel,
        maxBidMicros: c.maxBidMicros?.toString() ?? null,
        dailyBudgetMicros: c.dailyBudgetMicros?.toString() ?? null,
        lifetimeBudgetMicros: c.lifetimeBudgetMicros?.toString() ?? null,
        todaySpendMicros: c.todaySpendMicros.toString(),
        lifetimeSpendMicros: c.lifetimeSpendMicros.toString(),
        lifetimeImpressions: c.lifetimeImpressions.toString(),
        lifetimeClicks: c.lifetimeClicks.toString(),
        placementCodes: c.placementCodes,
        isHouse: c.isHouse,
      })),
    });
  }

  return jsonOk({
    advertisers: snapshots,
    pricingGuidance: {
      note: "You will never be charged more than your maximum bid. Actual price may be lower depending on competing eligible ads and MapAble placement reserve prices.",
      floorsAudCpm: {
        "Map Pin": 16,
        "Map Card": 18,
        "Access Results": 20,
        "Provider Finder": "24–28",
      },
    },
  });
}
