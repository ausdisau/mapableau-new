import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { PilotConsoleClient } from "@/components/access-intelligence/pilots/pilot-console-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Pilot & Evaluation Console | Access Intelligence",
};

export default function PilotsPage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Pilot & Evaluation Console"
        description="Synthetic cohorts, predicted-versus-observed journeys, learning and evidence-quality measures, and safety gates. Demo data only."
      >
        <PilotConsoleClient />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
