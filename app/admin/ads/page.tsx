import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { formatAudMicros } from "@/lib/ads/money/micros";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsPage() {
  await requireAdmin();

  const [
    campaignCount,
    creativeCount,
    advertiserCount,
    walletAgg,
    billingFailed,
    frozenWallets,
  ] = await Promise.all([
    prisma.adCampaign.count().catch(() => 0),
    prisma.adCreative.count().catch(() => 0),
    prisma.adAdvertiser.count().catch(() => 0),
    prisma.adWallet
      .aggregate({ _sum: { availableMicros: true } })
      .catch(() => ({ _sum: { availableMicros: null } })),
    prisma.adBillingEvent.count({ where: { status: "FAILED" } }).catch(() => 0),
    prisma.adWallet.count({ where: { status: "FROZEN" } }).catch(() => 0),
  ]);

  const unused = walletAgg._sum.availableMicros ?? 0n;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">MapAble Ads operations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Auction, prepaid wallets, and ledger controls. Sponsored placement
          never changes accessibility scores, accreditation, or organic ranking.
        </p>
      </header>

      <nav aria-label="Ads admin sections" className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href="/admin/ads/auction">
          Auction
        </Link>
        <Link className="underline" href="/admin/ads/pricing">
          Pricing
        </Link>
        <Link className="underline" href="/admin/ads/payments">
          Payments
        </Link>
        <Link className="underline" href="/admin/ads/wallets">
          Wallets
        </Link>
        <Link className="underline" href="/admin/ads/ledger">
          Ledger
        </Link>
        <Link className="underline" href="/admin/ads/advertisers">
          Advertisers
        </Link>
        <Link className="underline" href="/admin/ads/campaigns">
          Campaigns
        </Link>
        <Link className="underline" href="/admin/ads/creatives">
          Creatives
        </Link>
      </nav>

      <section className="rounded-lg border border-border p-4">
        <h2 className="font-semibold">Kill switch / flags</h2>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>Global enabled: {String(adsFlagsConfig.isEnabled())}</li>
          <li>
            Global kill switch: {String(adsFlagsConfig.isGlobalKillSwitch())}
          </li>
          <li>Auction: {String(adsFlagsConfig.isAuctionEnabled())}</li>
          <li>Billing: {String(adsFlagsConfig.isBillingEnabled())}</li>
          <li>
            Stripe top-ups: {String(adsFlagsConfig.isStripeTopupsEnabled())}
          </li>
          <li>Access: {String(adsFlagsConfig.isAccessEnabled())}</li>
          <li>
            Provider Finder: {String(adsFlagsConfig.isProviderFinderEnabled())}
          </li>
          <li>Internal: {String(adsFlagsConfig.isInternalEnabled())}</li>
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Advertisers</p>
          <p className="text-2xl font-bold">{advertiserCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Campaigns</p>
          <p className="text-2xl font-bold">{campaignCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Creatives</p>
          <p className="text-2xl font-bold">{creativeCount}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Unused prepaid</p>
          <p className="text-2xl font-bold">{formatAudMicros(unused)}</p>
          <p className="text-xs text-muted-foreground">
            Not recognized revenue
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Failed charges</p>
          <p className="text-2xl font-bold">{billingFailed}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Frozen wallets</p>
          <p className="text-2xl font-bold">{frozenWallets}</p>
        </div>
      </section>
    </div>
  );
}
