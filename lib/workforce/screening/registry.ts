import type { WorkerScreeningJurisdiction } from "@mapable/domain-workforce";

import type { WorkerScreeningProvider } from "@/lib/workforce/screening/provider";
import { VictoriaWorkerScreeningProvider } from "@/lib/workforce/screening/victoria";

const PROVIDERS = new Map<WorkerScreeningJurisdiction, WorkerScreeningProvider>([
  ["VIC", new VictoriaWorkerScreeningProvider()],
]);

export function getWorkerScreeningProvider(
  jurisdiction: WorkerScreeningJurisdiction,
): WorkerScreeningProvider | undefined {
  return PROVIDERS.get(jurisdiction);
}

export function listConfiguredWorkerScreeningProviderSlots() {
  return [
    { jurisdiction: "NSW", providerId: null, status: "pathway_only" },
    { jurisdiction: "VIC", providerId: "vic_worker_screening_status_api", status: "adapter_seeded" },
    { jurisdiction: "QLD", providerId: null, status: "pathway_only" },
    { jurisdiction: "SA", providerId: null, status: "pathway_only" },
    { jurisdiction: "WA", providerId: null, status: "pathway_only" },
    { jurisdiction: "TAS", providerId: null, status: "pathway_only" },
    { jurisdiction: "ACT", providerId: null, status: "pathway_only" },
    { jurisdiction: "NT", providerId: null, status: "pathway_only" },
  ] as const;
}
