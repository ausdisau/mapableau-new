import { OfficialDisabledClaimsGateway } from "@/lib/billing/claims/gateway";
import { ensureCoverageCareEnabled } from "@/lib/config/coverage-care";
import {
  listNdiaCapabilityDenials,
  type NdiaCapabilityResult,
} from "@/lib/tenancy/tenant-ndia-capabilities";

export interface CoverageCareNdiaReadiness {
  gatewayName: string;
  liveSubmissionEnabled: false;
  simulated: true;
  status: "disabled";
  summary: string;
  blockers: string[];
  capabilities: NdiaCapabilityResult[];
  checkedAt: string;
}

export function getCoverageCareNdiaReadiness(): CoverageCareNdiaReadiness {
  ensureCoverageCareEnabled();
  const gateway = new OfficialDisabledClaimsGateway();
  const capabilities = listNdiaCapabilityDenials();

  return {
    gatewayName: gateway.name,
    liveSubmissionEnabled: false,
    simulated: true,
    status: "disabled",
    summary:
      "NDIA Integration Gateway remains disabled for Coverage Care. No claims are submitted.",
    blockers: [
      "Official NDIA credentials and Digital Partnership Office approval required",
      "Regulatory approval for live claim submission",
      "Human go-live approval for MapAble NDIA pilot flags",
      "Coverage Care tenant is synthetic / pilot only",
      ...capabilities.map((c) => `${c.capability}: ${c.code}`),
    ],
    capabilities,
    checkedAt: new Date().toISOString(),
  };
}
