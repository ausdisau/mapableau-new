import Link from "next/link";

import { CampaignDetailClient } from "@/components/ads/CampaignDetailClient";

export const metadata = {
  title: "Campaign | MapAble Ads",
};

export default async function AdCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-xl py-8">
      <Link href="/provider/ads" className="text-sm text-primary underline">
        ← Back to ads
      </Link>
      <div className="mt-6">
        <CampaignDetailClient campaignId={id} />
      </div>
    </div>
  );
}
