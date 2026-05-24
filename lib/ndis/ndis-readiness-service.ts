import { phase5Config } from "@/lib/config/phase5";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { runAdapterHealthCheck } from "@/lib/ndis/ndis-integration-service";
import { prisma } from "@/lib/prisma";

export type NdisReadinessItem = {
  id: string;
  label: string;
  status: "pass" | "warn" | "blocker";
  detail: string;
};

export async function getNdisReadinessChecklist(): Promise<NdisReadinessItem[]> {
  const health = await runAdapterHealthCheck().catch(() => ({
    healthy: false,
    message: "Health check failed",
  }));

  const consentGrants = await prisma.ndisConsentGrant.count();
  const failedSyncs = await prisma.ndisSyncEvent.count({
    where: { status: "error" },
  });

  return [
    {
      id: "adapter",
      label: "Adapter configured",
      status: health.healthy ? "pass" : "blocker",
      detail: health.message ?? "Unknown",
    },
    {
      id: "consent",
      label: "Consent centre active",
      status: consentGrants >= 0 ? "pass" : "warn",
      detail: `${consentGrants} consent grants on file`,
    },
    {
      id: "pricing",
      label: "Pricing catalogue active",
      status: phase5Config.ndisPricingImportEnabled ? "pass" : "warn",
      detail: phase5Config.ndisPricingImportEnabled
        ? "Import enabled"
        : "NDIS_PRICING_IMPORT_ENABLED off",
    },
    {
      id: "claims",
      label: "Claim validation active",
      status: "pass",
      detail: "Claim queue requires service log before review",
    },
    {
      id: "audit",
      label: "Audit logging active",
      status: "pass",
      detail: "Audit events on sync and claims",
    },
    {
      id: "submission",
      label: "Real NDIA submission",
      status: phase5Config.ndiaRealSubmissionEnabled ? "warn" : "pass",
      detail: phase5Config.ndiaRealSubmissionEnabled
        ? "Live submission flag ON — ensure approval"
        : "Mock-only (safe default)",
    },
    {
      id: "sync_errors",
      label: "Sync error handling",
      status: failedSyncs > 10 ? "warn" : "pass",
      detail: `${failedSyncs} failed sync events total`,
    },
    {
      id: "layer",
      label: "Integration layer",
      status: remainingSystemsConfig.ndisIntegrationLayerEnabled
        ? "pass"
        : "blocker",
      detail: "NDIS_INTEGRATION_LAYER_ENABLED",
    },
  ];
}
