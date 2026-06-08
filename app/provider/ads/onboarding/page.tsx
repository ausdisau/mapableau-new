import { redirect } from "next/navigation";

import { AdOnboardingForm } from "@/components/ads/AdOnboardingForm";
import { Badge } from "@/components/ui/badge";
import { getDefaultProviderOrganisationId } from "@/lib/ads/provider-org";
import { mapableEyebrowBadgeClass, mapablePageContainerClass } from "@/lib/brand/styles";

export const metadata = {
  title: "Advertiser onboarding | MapAble Ads",
};

export default async function AdOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  const organisationId = await getDefaultProviderOrganisationId(org);
  if (!organisationId) redirect("/dashboard");

  return (
    <div className={mapablePageContainerClass}>
      <div className="mx-auto max-w-xl py-8">
        <Badge variant="outline" className={mapableEyebrowBadgeClass}>
          Ads manager
        </Badge>
        <h1 className="mt-4 font-heading text-2xl font-bold">Advertiser onboarding</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verified organisations in allowed disability-sector categories only.
        </p>
        <div className="mt-8">
          <AdOnboardingForm organisationId={organisationId} />
        </div>
      </div>
    </div>
  );
}
