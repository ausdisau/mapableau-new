import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { LearningProgressClient } from "@/components/access-intelligence/learning/learning-progress-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Learning progress | Access Intelligence",
  description: "Concept-level mastery without public leaderboards.",
};

export default function LearningProgressPage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Learning progress"
        description="Mastery is tracked by concept: introduced, developing, independent, can explain to others. No public leaderboards."
      >
        <LearningProgressClient />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
