import Link from "next/link";
import { redirect } from "next/navigation";

import { ProviderAdsClient } from "@/components/ads/ProviderAdsClient";
import { Badge } from "@/components/ui/badge";
import { getDefaultProviderOrganisationId } from "@/lib/ads/provider-org";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Ads manager | MapAble Provider",
};

export default async function ProviderAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  const organisationId = await getDefaultProviderOrganisationId(org);
  if (!organisationId) {
    redirect("/dashboard");
  }

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-3xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Provider console
        </Badge>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">
          MapAble <span className="text-primary">Ads Manager</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Create accessible, contextual ad campaigns across Provider Finder. Campaigns
          require payment and admin approval before going live.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/provider/ads/onboarding" className="text-primary underline">
            Advertiser onboarding
          </Link>
        </p>
        <div className="mt-10">
          <ProviderAdsClient organisationId={organisationId} />
        </div>
      </div>
    </div>
  );
}
