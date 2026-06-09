import { prisma } from "@/lib/prisma";
import { isBillingStripeConfigured } from "@/lib/billing-core/config";
import { phase8Config } from "@/lib/config/phase8";
import { isAdSenseEnabled } from "@/lib/ads/adsense-config";

export type RevenueSnapshot = {
  stripeConfigured: boolean;
  adsenseEnabled: boolean;
  marketplaceEnabled: boolean;
  totals: {
    billingInvoicesPaidCents: number;
    billingInvoicesOpenCents: number;
    adCampaignSpendCents: number;
    activeSubscriptions: number;
    publishedMarketplaceListings: number;
    activeAdCampaigns: number;
  };
};

export async function getRevenueSnapshot(): Promise<RevenueSnapshot> {
  const [
    paidAgg,
    openAgg,
    adSpendAgg,
    activeSubscriptions,
    publishedMarketplaceListings,
    activeAdCampaigns,
  ] = await Promise.all([
    prisma.billingInvoice.aggregate({
      where: { status: "paid" },
      _sum: { totalCents: true },
    }),
    prisma.billingInvoice.aggregate({
      where: { status: { in: ["draft", "issued", "pending_payment"] } },
      _sum: { totalCents: true },
    }),
    prisma.adCampaign.aggregate({
      _sum: { spentCents: true },
    }),
    prisma.billingSubscription.count({
      where: { status: { in: ["active", "trialing"] } },
    }),
    prisma.partnerMarketplaceListing.count({
      where: { status: "published" },
    }),
    prisma.adCampaign.count({
      where: { status: "active" },
    }),
  ]);

  return {
    stripeConfigured: isBillingStripeConfigured(),
    adsenseEnabled: isAdSenseEnabled(),
    marketplaceEnabled: phase8Config.partnerMarketplaceEnabled,
    totals: {
      billingInvoicesPaidCents: paidAgg._sum.totalCents ?? 0,
      billingInvoicesOpenCents: openAgg._sum.totalCents ?? 0,
      adCampaignSpendCents: adSpendAgg._sum.spentCents ?? 0,
      activeSubscriptions,
      publishedMarketplaceListings,
      activeAdCampaigns,
    },
  };
}
