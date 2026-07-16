import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { VerifyVenueDetailClient } from "@/components/access-intelligence/verify/verify-venue-detail-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

type Props = { params: Promise<{ placeId: string }> };

export const metadata: Metadata = {
  title: "Venue inventory | MapAble Verify",
};

export default async function VerifyVenuePage({ params }: Props) {
  const { placeId } = await params;
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Venue inventory"
        description="Elements, evidence gaps, incidents, attestations, and Access Coverage for authorised venue staff."
      >
        <VerifyVenueDetailClient placeId={placeId} />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
