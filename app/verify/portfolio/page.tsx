import type { Metadata } from "next";
import React from "react";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { VerifyPortfolioClient } from "@/components/access-intelligence/verify/verify-portfolio-client";
import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const metadata: Metadata = {
  title: "Portfolio | MapAble Verify",
  description: "Cross-site evidence gaps and portfolio overview for Verify Portfolio entitlements.",
};

export default function VerifyPortfolioPage() {
  return (
    <MapAbleCareMarketingShell>
      <AccessIntelligenceShell
        title="Verify Portfolio"
        description="Multi-venue evidence gaps and Access Coverage overview. Requires Verify Portfolio or Enterprise. Paying does not change accessibility scores."
      >
        <VerifyPortfolioClient />
      </AccessIntelligenceShell>
    </MapAbleCareMarketingShell>
  );
}
