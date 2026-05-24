import { redirect } from "next/navigation";

import { AdCampaignWizard } from "@/components/ads/AdCampaignWizard";
import { getDefaultProviderOrganisationId } from "@/lib/ads/provider-org";

export const metadata = {
  title: "New ad campaign | MapAble",
};

export default async function NewAdCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  const organisationId = await getDefaultProviderOrganisationId(org);
  if (!organisationId) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="font-heading text-2xl font-bold">Create campaign</h1>
      <div className="mt-8">
        <AdCampaignWizard organisationId={organisationId} />
      </div>
    </div>
  );
}
