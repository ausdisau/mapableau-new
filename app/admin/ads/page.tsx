import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { prisma } from "@/lib/prisma";

export default async function AdminAdsPage() {
  await requireAdmin();

  const [campaignCount, creativeCount, advertiserCount] = await Promise.all([
    prisma.adCampaign.count().catch(() => 0),
    prisma.adCreative.count().catch(() => 0),
    prisma.adAdvertiser.count().catch(() => 0),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-bold">MapAble Ads operations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Foundation admin surface. All production flags remain off until
          approved. Sponsored placement never changes accessibility scores,
          accreditation, or organic ranking.
        </p>
      </header>

      <section className="rounded-lg border border-border p-4">
        <h2 className="font-semibold">Kill switch / flags</h2>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li>Global enabled: {String(adsFlagsConfig.isEnabled())}</li>
          <li>
            Global kill switch: {String(adsFlagsConfig.isGlobalKillSwitch())}
          </li>
          <li>Access: {String(adsFlagsConfig.isAccessEnabled())}</li>
          <li>
            Provider Finder: {String(adsFlagsConfig.isProviderFinderEnabled())}
          </li>
          <li>Internal: {String(adsFlagsConfig.isInternalEnabled())}</li>
          <li>Google: {String(adsFlagsConfig.isGoogleEnabled())}</li>
          <li>EthicalAds: {String(adsFlagsConfig.isEthicalAdsEnabled())}</li>
          <li>Ad Manager: {String(adsFlagsConfig.isManagerEnabled())}</li>
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Advertisers</p>
          <p className="text-2xl font-bold">{advertiserCount}</p>
          <Link
            href="/admin/ads/advertisers"
            className="text-sm text-primary underline"
          >
            Manage
          </Link>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Campaigns</p>
          <p className="text-2xl font-bold">{campaignCount}</p>
          <Link
            href="/admin/ads/campaigns"
            className="text-sm text-primary underline"
          >
            Manage
          </Link>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Creatives</p>
          <p className="text-2xl font-bold">{creativeCount}</p>
          <Link
            href="/admin/ads/creatives"
            className="text-sm text-primary underline"
          >
            Review
          </Link>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Review queue</p>
          <p className="text-2xl font-bold">Vet</p>
          <Link
            href="/admin/ads/reviews"
            className="text-sm text-primary underline"
          >
            Open queue
          </Link>
        </div>
      </section>
    </div>
  );
}
