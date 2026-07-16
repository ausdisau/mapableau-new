import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";

export const metadata: Metadata = {
  title: "Regression lab | Access Intelligence",
  description: "Synthetic buildings, red-team corpus, and release evidence packs.",
};

export default function RegressionLabPage() {
  return (
    <AccessIntelligenceShell
      title="Regression and red-team lab"
      description="Detect decision regressions, run red-team cases, and package release evidence before pilots."
    >
      <ul className="list-disc space-y-2 pl-5">
        <li>Synthetic building generator (café, hall, campus, workplace, hospital, station, centre, event)</li>
        <li>Corridor-width and route regression detection</li>
        <li>Red-team corpus (diagnosis inference, false reassurance, consent replay, tenant escape)</li>
        <li>Adapter contract modes (timeout, stale, duplicate, emergency)</li>
      </ul>
      <p className="mt-4">
        Flag: <code>ACCESS_INTELLIGENCE_REGRESSION_SIMULATOR</code>. API:{" "}
        <code>POST /api/access-intelligence/regression/run</code>
      </p>
    </AccessIntelligenceShell>
  );
}
