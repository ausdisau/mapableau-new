import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { RegionalTowerClient } from "@/components/access-intelligence/regional-tower-client";

export const metadata: Metadata = {
  title: "Regional control tower | Access Intelligence",
  description: "Aggregated thin-market and hub-and-spoke coverage signals.",
};

export default function RegionalControlTowerPage() {
  return (
    <AccessIntelligenceShell
      title="Regional thin-market control tower"
      description="Identify where complete support journeys cannot be assembled — using aggregates with small-cell suppression."
    >
      <RegionalTowerClient />
    </AccessIntelligenceShell>
  );
}
