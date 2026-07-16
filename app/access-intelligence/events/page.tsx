import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";

export const metadata: Metadata = {
  title: "Temporary events | Access Intelligence",
};

export default function AiEventsPage() {
  return (
    <AccessIntelligenceShell
      title="Temporary event planning"
      description="Plan temporary accessible environments and day-of incident operations."
    >
      <p>
        Organiser workflows live under Verify events. Simulation API:{" "}
        <code>POST /api/access-intelligence/events/simulate</code>
      </p>
    </AccessIntelligenceShell>
  );
}
