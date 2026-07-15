import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { LivingBuildingModes } from "@/components/access-intelligence/living/living-building-modes";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { HARBOUR_PLACE_ID } from "@/lib/access-intelligence/living/harbour-civic";

type Props = { params: Promise<{ placeId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { placeId } = await params;
  return {
    title:
      placeId === HARBOUR_PLACE_ID
        ? "Harbour Civic Centre — Living Building | Access Intelligence"
        : "Living Building | Access Intelligence",
  };
}

export default async function LivingBuildingPage({ params }: Props) {
  const { placeId } = await params;
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="The Living Building"
        description="Visit, Learn, Operate, and Improve — powered by the same deterministic decision and route engines."
      >
        <LivingBuildingModes placeId={placeId} />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
