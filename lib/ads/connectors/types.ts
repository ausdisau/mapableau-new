export type BuyingChannel =
  | "mapable"
  | "meta"
  | "google"
  | "tiktok"
  | "linkedin"
  | "dooh";

export type IntegrationStatus =
  | "demo"
  | "pending_access"
  | "enabled"
  | "degraded"
  | "disabled";

export type DoohBuyingMode =
  | "programmatic_guaranteed"
  | "preferred_deal"
  | "private_auction"
  | "open_auction";

export type EvidenceTier =
  | "verified_play_log"
  | "partner_reported_play"
  | "modelled_impressions"
  | "unavailable";

export type ConnectorCapability = {
  channel: BuyingChannel;
  status: IntegrationStatus;
  supportedObjectives: string[];
  creativeFormats: string[];
  currencyCodes: string[];
  canQuote: boolean;
  canReserve: boolean;
  canSubmit: boolean;
  canPause: boolean;
  canReport: boolean;
};

export type ChannelSubmitResult = {
  externalId?: string;
  status: "accepted" | "pending" | "rejected" | "unknown";
};

export interface ChannelConnector {
  capabilities(accountId: string): Promise<ConnectorCapability>;
  validateCreative(input: unknown): Promise<{ ok: boolean; issues: string[] }>;
  estimate(input: unknown): Promise<{
    indicative: boolean;
    expiresAt?: string;
    totalMinor?: string;
    currency?: string;
  }>;
  submit(input: {
    internalOrderId: string;
    idempotencyKey: string;
    payload: unknown;
  }): Promise<ChannelSubmitResult>;
  reconcile(orderId: string): Promise<{
    status: string;
    observedAt: string;
    sourceId: string;
  }>;
  pause(orderId: string): Promise<void>;
  fetchMetrics(
    orderId: string,
    cursor?: string,
  ): Promise<{ rows: unknown[]; cursor?: string; observedAt: string }>;
}

export type DoohOrderState =
  | "draft"
  | "quoted"
  | "awaiting_review"
  | "awaiting_authorisation"
  | "submission_pending"
  | "submission_unknown"
  | "accepted_by_partner"
  | "scheduled"
  | "playing"
  | "pause_pending"
  | "cancel_pending"
  | "completed"
  | "partially_fulfilled"
  | "reconciled"
  | "disputed"
  | "failed";

export interface DoohBuyingAdapter {
  getCapabilities(): Promise<{
    enabled: boolean;
    countries: string[];
    modes: DoohBuyingMode[];
    proofTiers: EvidenceTier[];
  }>;
  searchInventory(query: unknown): Promise<{
    records: unknown[];
    observedAt: string;
    sourceId: string;
  }>;
  requestQuote(proposal: unknown): Promise<{
    quoteId: string;
    firm: boolean;
    expiresAt: string;
    termsHash: string;
    totalMinor: number;
    currency: string;
  }>;
  submitApprovedOrder(input: {
    internalOrderId: string;
    quoteId: string;
    termsHash: string;
    idempotencyKey: string;
  }): Promise<{ state: DoohOrderState; externalOrderId?: string }>;
  getOrderStatus(internalOrderId: string): Promise<{
    state: DoohOrderState;
    providerStatus: string;
    observedAt: string;
  }>;
  requestPause(internalOrderId: string): Promise<{ state: DoohOrderState }>;
  requestCancel(internalOrderId: string): Promise<{
    state: DoohOrderState;
    feeEstimateMinor?: string;
  }>;
  getDeliveryEvidence(internalOrderId: string): Promise<{
    proofTiers: EvidenceTier;
    observedPlays?: number;
    estimatedImpressions?: number;
    observedAt: string;
  }>;
}
