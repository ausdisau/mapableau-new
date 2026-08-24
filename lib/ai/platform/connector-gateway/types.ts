import type { DataClass } from "@/lib/ai/platform/types/classification";

export const MAPABLE_CONNECTOR_KEYS = [
  "stripe_billing",
  "email_sendgrid",
  "messaging_internal",
  "maps_geocode",
  "gais_access_read",
  "calendar_events",
  "ndia_claiming",
] as const;

export type MapAbleConnectorKey = (typeof MAPABLE_CONNECTOR_KEYS)[number];

export const CONNECTOR_MODES = ["read", "write", "read_write"] as const;
export type ConnectorMode = (typeof CONNECTOR_MODES)[number];

export const CONNECTOR_MATURITY = ["live", "exploratory", "stub"] as const;
export type ConnectorMaturity = (typeof CONNECTOR_MATURITY)[number];

export const CONNECTOR_DOMAINS = [
  "billing",
  "messaging",
  "maps",
  "access_intelligence",
  "calendar",
  "ndis_claiming",
  "notifications",
] as const;
export type ConnectorDomain = (typeof CONNECTOR_DOMAINS)[number];

export type ConnectorRetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryOn: Array<"timeout" | "transient" | "rate_limit">;
};

export type ConnectorAuditPolicy = {
  auditReads: boolean;
  auditWrites: boolean;
  includePayloadHash: boolean;
};

export type ConnectorHealthCheck = {
  probeKey: string;
  intervalMs: number;
};

export type MapAbleConnector = {
  key: MapAbleConnectorKey;
  version: string;
  domain: ConnectorDomain;
  mode: ConnectorMode;
  dataClasses: DataClass[];
  requiredConsentScopes: string[];
  allowedOperations: string[];
  featureFlag: string;
  killSwitchKey: string;
  healthCheck: ConnectorHealthCheck;
  timeoutMs: number;
  retryPolicy: ConnectorRetryPolicy;
  idempotencySupport: boolean;
  auditPolicy: ConnectorAuditPolicy;
  maturity: ConnectorMaturity;
  inventoryNote: string;
  label: string;
};

export const CONNECTOR_HEALTH_STATES = [
  "healthy",
  "degraded",
  "unavailable",
  "circuit_open",
  "kill_switched",
  "disabled",
] as const;
export type ConnectorHealthState = (typeof CONNECTOR_HEALTH_STATES)[number];

export const CONNECTOR_POLICY_REASON_CODES = [
  "gateway_disabled",
  "gateway_kill_switch",
  "connector_disabled",
  "connector_kill_switch",
  "connector_unavailable",
  "circuit_open",
  "missing_consent",
  "tenant_mismatch",
  "operation_not_allowed",
  "mode_not_allowed",
  "write_requires_approved_envelope",
  "approved_envelope_invalid",
  "arbitrary_payload_rejected",
  "agent_credential_access_denied",
  "injection_content_quarantined",
  "timeout",
  "idempotency_replay",
  "idempotency_conflict",
  "manual_fallback_required",
] as const;
export type ConnectorPolicyReasonCode =
  (typeof CONNECTOR_POLICY_REASON_CODES)[number];

export type ConnectorActor = {
  actorId: string;
  actorType: "participant" | "authorised_human" | "system_service" | "agent";
  role: "agent" | "kernel" | "gateway" | "human" | "service";
};

export type ConnectorTenantContext = {
  tenantId: string;
  participantId: string | null;
  organisationId: string | null;
};

export type ApprovedActionEnvelope = {
  proposalId: string;
  approvalId: string;
  nonce: string;
  payloadHash: string;
  actionKey: string;
  participantId: string;
  approvedPayload: Record<string, unknown>;
};

export type ConnectorReadRequest = {
  connectorKey: MapAbleConnectorKey;
  operation: string;
  purpose: string;
  actor: ConnectorActor;
  tenant: ConnectorTenantContext;
  consentScopes: string[];
  scope: Record<string, unknown>;
  provenanceClass?: string;
};

export type ConnectorWriteRequest = {
  connectorKey: MapAbleConnectorKey;
  operation: string;
  actor: ConnectorActor;
  tenant: ConnectorTenantContext;
  consentScopes: string[];
  approvedEnvelope: ApprovedActionEnvelope;
  idempotencyKey?: string;
};

/** Context Fabric–compatible canonical record for gateway reads. */
export type ConnectorCanonicalRecord = {
  recordId: string;
  connectorKey: MapAbleConnectorKey;
  tenantId: string;
  dataClass: DataClass;
  contentKind: "data";
  payload: Record<string, unknown>;
  provenance: {
    sourceSystem: string;
    sourceTrustClass:
      | "system_record"
      | "provider_report"
      | "external_read"
      | "stub";
    retrievedAt: string;
    purpose: string;
    actorId: string;
    injectionQuarantined: boolean;
  };
};

export type ConnectorInvokeResult<T = unknown> = {
  ok: boolean;
  status: "completed" | "degraded" | "failed" | "rejected" | "replayed";
  reasonCode?: ConnectorPolicyReasonCode;
  detail?: string;
  data?: T;
  records?: ConnectorCanonicalRecord[];
  healthState: ConnectorHealthState;
  attemptCount: number;
  idempotentReplay?: boolean;
  auditId?: string;
  manualFallbackHint?: string;
};

export type ConnectorCredentialHandle = {
  handleId: string;
  connectorKey: MapAbleConnectorKey;
  scope: string[];
  label: string;
};

export type ConnectorAuditEvent = {
  auditId: string;
  at: string;
  connectorKey: MapAbleConnectorKey;
  operation: string;
  direction: "read" | "write";
  tenantId: string;
  actorId: string;
  actorRole: ConnectorActor["role"];
  purpose?: string;
  proposalId?: string;
  approvalId?: string;
  payloadHash?: string;
  outcome: "completed" | "degraded" | "failed" | "rejected" | "replayed";
  reasonCode?: ConnectorPolicyReasonCode;
};
