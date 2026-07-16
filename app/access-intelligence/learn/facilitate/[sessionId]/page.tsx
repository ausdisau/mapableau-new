import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { FacilitateSessionClient } from "@/components/access-intelligence/learning/facilitate-session-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Facilitate session | Access Intelligence",
  description: "Pause, reveal, collect responses, and debrief Learning Lab scenarios.",
};

export default async function FacilitateSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Facilitate"
        description="Present a scenario to individuals or groups with pause/reveal, anonymous responses, structured debriefs, and accessible exports."
      >
        <FacilitateSessionClient sessionId={sessionId} />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
