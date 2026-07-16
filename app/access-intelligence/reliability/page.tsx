import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";

export const metadata: Metadata = {
  title: "Evidence reliability | Access Intelligence",
  description:
    "Record-level evidence health, freshness policies, and reverification queues.",
};

export default function ReliabilityConsolePage() {
  return (
    <AccessIntelligenceShell
      title="Evidence reliability"
      description="Maintain trustworthy AccessPlace evidence over time. Health scores apply to records — never to people."
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Console capabilities</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Feature-specific freshness policies (lift 24h, door width 24 months, toilet 7 days)</li>
          <li>Conflict, missing provenance, and orphaned evidence detection</li>
          <li>Reverification task generation</li>
          <li>Deterministic confidence recalculation (unknowns stay unknown)</li>
        </ul>
        <p>
          Enable with <code>ACCESS_INTELLIGENCE_RELIABILITY_CONSOLE=true</code>.
          API: <code>POST /api/access-intelligence/reliability/scan</code>
        </p>
      </section>
    </AccessIntelligenceShell>
  );
}
