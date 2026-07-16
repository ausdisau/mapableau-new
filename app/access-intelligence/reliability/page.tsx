import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { ReliabilityConsoleClient } from "@/components/access-intelligence/reliability-console-client";

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
      <ReliabilityConsoleClient />
    </AccessIntelligenceShell>
  );
}
