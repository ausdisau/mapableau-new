import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { listAdvertisersForUser } from "@/lib/ads/auth/advertiser-access";
import { getOrCreateAdWallet } from "@/lib/ads/billing/wallet";
import { formatAudMicros, microsToString } from "@/lib/ads/money/micros";
import { ADS_TOPUP_PRESETS_CENTS } from "@/lib/ads/auction/config";
import { prisma } from "@/lib/prisma";
import { AdsTopUpForm } from "@/app/provider/(console)/ads/top-up-form";

export default async function ProviderAdsPage() {
  const user = await requireAuth();
  const advertisers = await listAdvertisersForUser(user);

  const rows = [];
  for (const advertiser of advertisers) {
    const wallet = await getOrCreateAdWallet({ advertiserId: advertiser.id });
    const campaigns = await prisma.adCampaign.findMany({
      where: { advertiserId: advertiser.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    rows.push({ advertiser, wallet, campaigns });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-bold">MapAble Ads</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Prepaid advertiser wallet and campaign reporting. Bidding affects
          sponsored placements only — never accessibility or provider suitability
          scores.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm" role="status">
          No advertiser account is linked to your organisation yet. Ask a
          MapAble admin to create one.
        </p>
      ) : (
        rows.map(({ advertiser, wallet, campaigns }) => (
          <section
            key={advertiser.id}
            className="space-y-4 border-b border-border pb-8"
            aria-labelledby={`adv-${advertiser.id}`}
          >
            <h2 id={`adv-${advertiser.id}`} className="text-xl font-semibold">
              {advertiser.name}
            </h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Wallet balance</dt>
                <dd className="font-medium">
                  {formatAudMicros(wallet.availableMicros)}{" "}
                  <span className="sr-only">
                    ({microsToString(wallet.availableMicros)} micros)
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Wallet status</dt>
                <dd>
                  <span
                    className={
                      wallet.status === "FROZEN"
                        ? "font-semibold text-destructive"
                        : undefined
                    }
                  >
                    {wallet.status}
                  </span>
                  {wallet.status === "FROZEN" ? (
                    <span className="ml-2 text-sm">(paused — contact support)</span>
                  ) : null}
                </dd>
              </div>
            </dl>

            <AdsTopUpForm
              advertiserId={advertiser.id}
              presets={ADS_TOPUP_PRESETS_CENTS}
              disabled={wallet.status !== "ACTIVE"}
            />

            <div className="flex flex-wrap gap-3">
              <Link
                href="/provider/ads/new"
                className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                New campaign
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <caption className="sr-only">
                  Campaigns for {advertiser.name}
                </caption>
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className="py-2 pr-3">
                      Campaign
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Model
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Status
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Max bid
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Today spend
                    </th>
                    <th scope="col" className="py-2 pr-3">
                      Lifetime
                    </th>
                    <th scope="col" className="py-2">
                      Imp / Clicks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-4 text-muted-foreground">
                        No campaigns yet.
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((c) => {
                      const imps = Number(c.lifetimeImpressions);
                      const clicks = Number(c.lifetimeClicks);
                      const ctr =
                        imps > 0 ? ((clicks / imps) * 100).toFixed(2) : "—";
                      return (
                        <tr key={c.id} className="border-b border-border/60">
                          <td className="py-2 pr-3 font-medium">{c.name}</td>
                          <td className="py-2 pr-3">{c.bidModel}</td>
                          <td className="py-2 pr-3">{c.status}</td>
                          <td className="py-2 pr-3">
                            {c.maxBidMicros
                              ? formatAudMicros(c.maxBidMicros)
                              : "—"}
                          </td>
                          <td className="py-2 pr-3">
                            {formatAudMicros(c.todaySpendMicros)}
                          </td>
                          <td className="py-2 pr-3">
                            {formatAudMicros(c.lifetimeSpendMicros)}
                          </td>
                          <td className="py-2">
                            {imps} / {clicks} (CTR {ctr}%)
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-muted-foreground">
              You will never be charged more than your maximum bid. Actual price
              may be lower depending on competing eligible ads and MapAble
              placement reserve prices.
            </p>
          </section>
        ))
      )}
    </div>
  );
}
