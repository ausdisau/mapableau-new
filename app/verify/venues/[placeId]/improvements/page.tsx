import type { Metadata } from "next";
import React, { Suspense } from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { MutationStudio } from "@/components/access-intelligence/living/mutation-studio";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

type Props = { params: Promise<{ placeId: string }> };

export const metadata: Metadata = {
  title: "Improvements | MapAble Verify",
};

export default async function VerifyImprovementsPage({ params }: Props) {
  const { placeId } = await params;
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Venue Mutation Studio"
        description="Preview operational and physical improvements with Access Coverage. Previews never mutate baseline data."
      >
        <Suspense fallback={<p role="status">Loading mutation studio…</p>}>
          <MutationStudio placeId={placeId} />
        </Suspense>
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
