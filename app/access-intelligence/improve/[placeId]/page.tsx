import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { MutationStudio } from "@/components/access-intelligence/living/mutation-studio";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

type Props = { params: Promise<{ placeId: string }> };

export const metadata: Metadata = {
  title: "Improve — Living Building | Access Intelligence",
};

export default async function ImprovePage({ params }: Props) {
  const { placeId } = await params;
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Improve it"
        description="Venue Mutation Studio with Access Coverage previews. Ranking factors are transparent planning aids, not moral truths."
      >
        <MutationStudio placeId={placeId} />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
