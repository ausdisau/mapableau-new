import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignCreativeActions } from "@/components/ads/manager/CampaignCreativeActions";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { assertCanAccessAdvertiser } from "@/lib/ads/auth/advertiser-access";
import { requireAuth, requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderAdsCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  await requirePermission("care:manage:org");

  if (!adsFlagsConfig.isManagerEnabled()) {
    return <p>Ad Manager is disabled.</p>;
  }

  const { id } = await params;
  const campaign = await prisma.adCampaign.findUnique({
    where: { id },
    include: {
      advertiser: true,
      creatives: { orderBy: { updatedAt: "desc" } },
    },
  });
  if (!campaign) notFound();

  try {
    await assertCanAccessAdvertiser(user, campaign.advertiserId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/provider/ads" className="text-sm text-primary underline">
        ← Ad Manager
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">{campaign.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {campaign.advertiser.name} · status {campaign.status}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Submitted for MapAble review. Ads will not appear until approved and
          enabled by MapAble.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Creatives</h2>
        {campaign.creatives.length === 0 ? (
          <p className="text-sm text-muted-foreground">No creatives.</p>
        ) : (
          <CampaignCreativeActions
            creatives={campaign.creatives.map((c) => ({
              id: c.id,
              headline: c.headline,
              status: c.status,
              claimFlags: c.claimFlags,
            }))}
          />
        )}
      </section>
    </div>
  );
}
