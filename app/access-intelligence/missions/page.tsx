import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";

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
      <p>
        Extends the existing support-coordinator and case systems. Mission states:
        draft → awaiting input/evidence → review → confirmation → in progress →
        completed.
      </p>
      <p className="mt-3">
        Flag: <code>ACCESS_INTELLIGENCE_MISSION_CONSOLE</code>. Also see{" "}
        <a className="underline" href="/support-coordinator/missions">
          /support-coordinator/missions
        </a>
        .
      </p>
    </AccessIntelligenceShell>
  );
}
