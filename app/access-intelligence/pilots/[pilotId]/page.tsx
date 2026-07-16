import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { PilotConsoleClient } from "@/components/access-intelligence/pilots/pilot-console-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

type Props = { params: Promise<{ pilotId: string }> };

export const metadata: Metadata = {
  title: "Pilot detail | Access Intelligence",
};

export default async function PilotDetailPage({ params }: Props) {
  const { pilotId } = await params;
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Pilot detail"
        description="Synthetic evaluation view with de-identified export."
      >
        <PilotConsoleClient pilotId={pilotId} />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
