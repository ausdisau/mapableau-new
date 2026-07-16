import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { InterviewFlightSimClient } from "@/components/access-intelligence/living/interview-flight-sim-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Interview on Level 3 — Living Building Learn | Access Intelligence",
  description:
    "Flagship Access Intelligence flight simulator using the same deterministic fit and route engines as Visit mode.",
};

export default function InterviewLevel3Page() {
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Learn it — The Interview on Level 3"
        description="Investigate evidence, decide, face a live lift outage, revise via the western lift, teach back, reflect, and transfer. Decision Mirror and rubric are deterministic."
      >
        <InterviewFlightSimClient />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
