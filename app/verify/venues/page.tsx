import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { VerifyVenuesClient } from "@/components/access-intelligence/verify/verify-venues-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Verify venues | MapAble Verify",
};

export default function VerifyVenuesPage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Venues"
        description="Fictional demonstration venues for MapAble Verify."
      >
        <VerifyVenuesClient />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
