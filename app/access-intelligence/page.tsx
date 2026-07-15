import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceWorkspace } from "@/components/access-intelligence/access-intelligence-workspace";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Access Intelligence | MapAble",
  description:
    "Personal access planning: passport requirements, evidence confidence, live conditions, and accessible routes — not a generic wheelchair icon.",
};

export default function AccessIntelligencePage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceWorkspace />
    </MapAbleCareMarketingShell>
  );
}
