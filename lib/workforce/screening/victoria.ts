import {
  workerScreeningEvidenceSchema,
  workerScreeningQuerySchema,
  type WorkerScreeningEvidence,
  type WorkerScreeningQuery,
} from "@mapable/domain-workforce";

import { getWorkerScreeningConfig } from "@/lib/config/worker-screening";
import {
  WorkerScreeningProviderNotConfiguredError,
  type WorkerScreeningProvider,
} from "@/lib/workforce/screening/provider";

/**
 * Victoria publishes a Worker Screening Status API capable of single and bulk
 * status checks. The public catalogue page does not expose enough authenticated
 * contract detail for MapAble to safely hard-code the live transport yet.
 *
 * This provider therefore establishes the stable MapAble boundary while keeping
 * all live calls fail-closed until the authenticated API definition is reviewed.
 */
export class VictoriaWorkerScreeningProvider implements WorkerScreeningProvider {
  readonly providerId = "vic_worker_screening_status_api";
  readonly jurisdiction = "VIC" as const;
  readonly capabilities = ["single_status_lookup", "bulk_status_lookup"] as const;

  async healthCheck() {
    const config = getWorkerScreeningConfig();
    const configured = Boolean(
      config.enabled
        && config.victoriaEnabled
        && config.victoriaBaseUrl
        && config.victoriaApiKeyConfigured,
    );

    return {
      providerId: this.providerId,
      jurisdiction: this.jurisdiction,
      configured,
      liveTransportEnabled: false,
      capabilities: [...this.capabilities],
      notes: configured
        ? [
            "Credentials/configuration are present, but live transport remains disabled until the authenticated API contract is reviewed and implemented.",
          ]
        : [
            "Victoria Worker Screening Status API is not fully configured.",
          ],
    };
  }

  async queryStatus(query: WorkerScreeningQuery): Promise<WorkerScreeningEvidence[]> {
    workerScreeningQuerySchema.parse({ ...query, jurisdiction: query.jurisdiction ?? "VIC" });

    const health = await this.healthCheck();
    if (!health.configured || !health.liveTransportEnabled) {
      throw new WorkerScreeningProviderNotConfiguredError(this.providerId);
    }

    // Intentionally unreachable until the authenticated API contract is wired.
    // When implemented, parse every upstream payload through a jurisdiction-
    // specific Zod schema and map it to workerScreeningEvidenceSchema before
    // returning it to the rest of MapAble.
    return [
      workerScreeningEvidenceSchema.parse({
        jurisdiction: "VIC",
        status: "unable_to_verify",
        source: "state_or_territory_worker_screening_unit",
        checkedAt: new Date().toISOString(),
        notes: ["Live Victoria transport has not been implemented."],
      }),
    ];
  }
}
