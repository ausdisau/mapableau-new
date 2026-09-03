import type {
  WorkerScreeningEvidence,
  WorkerScreeningJurisdiction,
  WorkerScreeningQuery,
} from "@mapable/domain-workforce";

export type WorkerScreeningProviderCapability =
  | "single_status_lookup"
  | "bulk_status_lookup"
  | "public_guidance_only";

export type WorkerScreeningProviderHealth = {
  providerId: string;
  jurisdiction?: WorkerScreeningJurisdiction;
  configured: boolean;
  liveTransportEnabled: boolean;
  capabilities: readonly WorkerScreeningProviderCapability[];
  notes: string[];
};

export interface WorkerScreeningProvider {
  readonly providerId: string;
  readonly jurisdiction?: WorkerScreeningJurisdiction;
  readonly capabilities: readonly WorkerScreeningProviderCapability[];

  healthCheck(): Promise<WorkerScreeningProviderHealth>;

  queryStatus(query: WorkerScreeningQuery): Promise<WorkerScreeningEvidence[]>;
}

export class WorkerScreeningProviderNotConfiguredError extends Error {
  constructor(providerId: string) {
    super(`Worker screening provider ${providerId} is not configured.`);
    this.name = "WorkerScreeningProviderNotConfiguredError";
  }
}
