import type { CanonicalNdisClaim } from "@/lib/ndis-gateway/domain/claim";

export type AdapterKind =
  | "mock"
  | "ndia_direct"
  | "approved_aggregator"
  | "portal_export"
  | "plan_manager_invoice"
  | "self_managed_invoice"
  | "manual_claim";

export type AdapterReadiness = {
  ready: boolean;
  kind: AdapterKind;
  reasons: string[];
  liveConfigured: boolean;
};

export type SubmissionContext = {
  organisationId: string;
  actorUserId: string;
  correlationId: string;
  idempotencyKey: string;
  /** Live submission requires explicit human approval (Wave 2/5). */
  approvalId?: string | null;
  dryRun?: boolean;
};

export type PreparedSubmission = {
  adapterKind: AdapterKind;
  claimId: string;
  payloadHash: string;
  /** Opaque prepared body — adapters own the wire format. */
  preparedPayload: unknown;
  correlationId: string;
};

export type SubmissionReceipt = {
  adapterKind: AdapterKind;
  externalReference: string | null;
  externalStatus: string;
  accepted: boolean;
  correlationId: string;
  rawResponseRetained: boolean;
};

export type ExternalClaimStatus = {
  externalReference: string;
  externalStatus: string;
  mappedStatusHint?: string | null;
  rawPreserved: boolean;
};

export type ExternalResponseInput = {
  format: string;
  body: unknown;
  organisationId: string;
};

export type ExternalClaimEvent = {
  externalEventId: string;
  externalStatus: string;
  mappedStatusHint?: string | null;
  receivedAt: string;
  payloadHash: string;
};

/**
 * Submission adapter contract. Implementations land in Wave 5.
 * Wave 1 defines the interface only — no network adapters.
 */
export interface NdisClaimSubmissionAdapter {
  readonly kind: AdapterKind;
  getReadiness(): Promise<AdapterReadiness>;
  prepare(
    claim: CanonicalNdisClaim,
    context: SubmissionContext
  ): Promise<PreparedSubmission>;
  submit(
    prepared: PreparedSubmission,
    context: SubmissionContext
  ): Promise<SubmissionReceipt>;
  getStatus?(
    externalReference: string,
    context: SubmissionContext
  ): Promise<ExternalClaimStatus>;
  importResponse?(
    input: ExternalResponseInput,
    context: SubmissionContext
  ): Promise<ExternalClaimEvent[]>;
}
