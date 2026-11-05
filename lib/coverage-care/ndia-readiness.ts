import { OfficialDisabledClaimsGateway } from "@/lib/billing/claims/gateway";
import { ensureCoverageCareEnabled } from "@/lib/config/coverage-care";

export interface CoverageCareNdiaReadiness {
  gatewayName: string;
  liveSubmissionEnabled: false;
  simulated: true;
  status: "disabled";
  summary: string;
  blockers: string[];
  checkedAt: string;
}

/**
 * Surfaces the existing disabled NDIA claims gateway for the Coverage Care
 * admin readiness panel. Never enables live submission.
 */
export function getCoverageCareNdiaReadiness(): CoverageCareNdiaReadiness {
  ensureCoverageCareEnabled();
  const gateway = new OfficialDisabledClaimsGateway();

  return {
    gatewayName: gateway.name,
    liveSubmissionEnabled: false,
    simulated: true,
    status: "disabled",
    summary:
      "NDIA Integration Gateway remains disabled for Coverage Care. No claims are submitted.",
    blockers: [
      "Official NDIA credentials and agreement required",
      "Regulatory approval for live claim submission",
      "Human go-live approval for MAPABLE NDIA pilot flags",
      "Coverage Care tenant is synthetic / pilot only",
    ],
    checkedAt: new Date().toISOString(),
  };
}
