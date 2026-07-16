import type { Metadata } from "next";

import { AccessIntelligenceShell } from "@/components/access-intelligence/access-intelligence-shell";
import { EmploymentOrchestratorClient } from "@/components/access-intelligence/employment-orchestrator-client";

export const metadata: Metadata = {
  title: "Employment access | Access Intelligence",
  description: "Interview and first-day accessibility orchestration.",
};

export default function EmploymentAccessPage() {
  return (
    <AccessIntelligenceShell
      title="Interview & first-day access"
      description="Connect Jobs, Transport, Care, Access, and Calendar for employment journeys — with consent-gated disclosures only."
    >
      <EmploymentOrchestratorClient />
    </AccessIntelligenceShell>
  );
}
