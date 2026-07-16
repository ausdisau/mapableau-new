import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { VerifyVenuesClient } from "@/components/access-intelligence/verify/verify-venues-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "MapAble Verify | Access Intelligence",
  description:
    "Venue accessibility inventory, evidence, incidents, and public guides — distinct from assessor verification.",
};

export default function VerifyHomePage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="MapAble Verify"
        description="Structured accessibility inventory for venues. Venue attestations stay labelled separately from qualified assessor verification. Paying does not make a venue more accessible."
      >
        <VerifyVenuesClient />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
