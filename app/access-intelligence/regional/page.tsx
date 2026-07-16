import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";

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
      <ul className="list-disc space-y-2 pl-5">
        <li>Distinguishes no provider vs no capacity vs transport vs venue evidence gaps</li>
        <li>No participant ranking or worthiness scores</li>
        <li>Demand signals clearly labelled vs verified unmet need</li>
      </ul>
      <p className="mt-4">
        Flag: <code>ACCESS_INTELLIGENCE_REGIONAL_CONTROL_TOWER</code>
      </p>
    </AccessIntelligenceShell>
  );
}
