import Link from "next/link";

import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { listOrgCampaigns, listOrgCreatives } from "@/lib/ads/services/manager-service";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { getProviderControlPanelSummaryForUser } from "@/lib/provider/provider-control-panel-service";

export const metadata = { title: "Ad Manager | MapAble" };

export default async function ProviderAdsPage() {
  const user = await requireAuth();
  await requirePermission("care:manage:org");

  if (!adsFlagsConfig.isManagerEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Ad Manager</h1>
        <p className="text-muted-foreground">
          MapAble Ad Manager is not enabled for this environment.
        </p>
        <Link href="/provider" className="text-sm text-primary underline">
          ← Provider control panel
        </Link>
      </div>
    );
  }

  const summary = await getProviderControlPanelSummaryForUser(user);
  if (!summary.primaryOrganisation) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Ad Manager</h1>
        <p className="text-muted-foreground">
          Link your account to an organisation before pre-registering as an
          advertiser.
        </p>
      </div>
    );
  }

  const [campaigns, creatives] = await Promise.all([
    listOrgCampaigns(user),
    listOrgCreatives(user),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <Link href="/provider" className="text-sm text-primary underline">
          ← Provider control panel
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Ad Manager</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pre-register advertisers and draft campaigns for{" "}
          <strong>{summary.primaryOrganisation.organisationName}</strong>.
          Submitted creatives are reviewed by MapAble. Ads will not appear until
          approved and enabled by MapAble.
        </p>
      </header>

      <p>
        <Link
          href="/provider/ads/new"
          className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Pre-register advertiser
        </Link>
      </p>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No campaigns yet.</p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-border p-3"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.advertiser.name} · {c.status}
                  </p>
                </div>
                <Link
                  href={`/provider/ads/campaigns/${c.id}`}
                  className="text-sm text-primary underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Creatives</h2>
        {creatives.length === 0 ? (
          <p className="text-sm text-muted-foreground">No creatives yet.</p>
        ) : (
          <ul className="space-y-2">
            {creatives.map((c) => (
              <li
                key={c.id}
                className="rounded border border-border p-3 text-sm"
              >
                <p className="font-medium">{c.headline}</p>
                <p className="text-muted-foreground">
                  {c.status}
                  {c.claimFlags.length
                    ? ` · flags: ${c.claimFlags.join(", ")}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
