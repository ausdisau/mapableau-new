import { microsToString } from "@/lib/ads/money/micros";
import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const url = new URL(request.url);
  const walletId = url.searchParams.get("walletId") ?? undefined;

  const entries = await prisma.adWalletLedgerEntry.findMany({
    where: walletId ? { walletId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const auctions = await prisma.adAuctionResult.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const billing = await prisma.adBillingEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonOk({
    ledger: entries.map((e) => ({
      id: e.id,
      walletId: e.walletId,
      type: e.type,
      amountMicros: microsToString(e.amountMicros),
      balanceAfterMicros: e.balanceAfterMicros
        ? microsToString(e.balanceAfterMicros)
        : null,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      createdAt: e.createdAt.toISOString(),
    })),
    recentAuctions: auctions.map((a) => ({
      id: a.id,
      decisionId: a.decisionId,
      placementCode: a.placementCode,
      winnerCampaignId: a.winnerCampaignId,
      winnerBidModel: a.winnerBidModel,
      clearingEcpmMicros: a.clearingEcpmMicros?.toString() ?? null,
      clearingUnitPriceMicros: a.clearingUnitPriceMicros?.toString() ?? null,
      reservePriceMicros: a.reservePriceMicros.toString(),
      algorithmVersion: a.algorithmVersion,
      createdAt: a.createdAt.toISOString(),
    })),
    recentBilling: billing.map((b) => ({
      id: b.id,
      status: b.status,
      bidModel: b.bidModel,
      chargedMicros: b.chargedMicros.toString(),
      campaignId: b.campaignId,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}
