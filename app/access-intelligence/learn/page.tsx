import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { LearningLabHub } from "@/components/access-intelligence/learning/learning-lab-hub";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";
import { listPublishedScenarios } from "@/lib/access-intelligence/learning/scenarios";

export const metadata: Metadata = {
  title: "Access Intelligence Learning Lab | MapAble",
  description:
    "Optional didactic experience for personal access fit, evidence quality, routes, consent, and accessible service delivery — without blocking Plan mode.",
};

export default function LearningLabPage() {
  const scenarios = listPublishedScenarios();
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Learning Lab"
        description="Optional modes to learn access reasoning. Plan mode stays available without completing a lesson."
      >
        <LearningLabHub scenarios={scenarios} />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
