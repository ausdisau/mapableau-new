import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { JourneyReliabilityClient } from "@/components/access-intelligence/journey-reliability-client";

export const metadata: Metadata = {
  title: "Journey reliability | Access Intelligence",
  description:
    "Visit preflight, guardian recovery proposals, and offline visit packs.",
};

export default function JourneyReliabilityPage() {
  return (
    <AccessIntelligenceShell
      title="Journey preflight & recovery"
      description="Participant-controlled reliability for saved journeys across transport, care, and venue access."
    >
      <JourneyReliabilityClient />
    </AccessIntelligenceShell>
  );
}
