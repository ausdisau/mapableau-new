import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { MissionConsoleClient } from "@/components/access-intelligence/mission-console-client";

export const metadata: Metadata = {
  title: "Missions | Access Intelligence",
  description: "Participant-authorised support coordination missions.",
};

export default function MissionsPage() {
  return (
    <AccessIntelligenceShell
      title="Support coordinator missions"
      description="Coordinate goals across care, transport, access, and calendar with participant authority and approval-gated writes."
    >
      <MissionConsoleClient />
    </AccessIntelligenceShell>
  );
}
