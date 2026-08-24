import {
  clearConnectorAudit,
  clearConnectorIdempotency,
} from "./audit";
import { clearTestConnectorAdapters } from "./adapters";
import { clearCircuitBreakers } from "./circuit-breaker";
import { clearCredentialHandles } from "./credentials";
import { clearConnectorHealth } from "./health";

export type {
  MapAbleConnectorKey,
  MapAbleConnector,
  ConnectorMode,
  ConnectorMaturity,
  ConnectorDomain,
  ConnectorRetryPolicy,
  ConnectorAuditPolicy,
  ConnectorHealthCheck,
  ConnectorHealthState,
  ConnectorPolicyReasonCode,
  ConnectorActor,
  ConnectorTenantContext,
  ApprovedActionEnvelope,
  ConnectorReadRequest,
  ConnectorWriteRequest,
  ConnectorCanonicalRecord,
  ConnectorInvokeResult,
  ConnectorCredentialHandle,
  ConnectorAuditEvent,
} from "./types";

export {
  MAPABLE_CONNECTOR_KEYS,
  CONNECTOR_MODES,
  CONNECTOR_MATURITY,
  CONNECTOR_DOMAINS,
  CONNECTOR_HEALTH_STATES,
  CONNECTOR_POLICY_REASON_CODES,
} from "./types";

export {
  mapAbleConnectorKeySchema,
  connectorActorSchema,
  connectorTenantSchema,
  approvedActionEnvelopeSchema,
  connectorReadRequestSchema,
  connectorWriteRequestSchema,
  connectorCanonicalRecordSchema,
} from "./schemas";

export {
  MAPABLE_CONNECTOR_REGISTRY,
  listMapAbleConnectors,
  getMapAbleConnector,
  requireMapAbleConnector,
  isMapAbleConnectorKey,
  listConnectorInventory,
} from "./registry";

export {
  evaluateGatewayMasterPolicy,
  evaluateConnectorAvailability,
  evaluateReadPolicy,
  evaluateWritePolicy,
  validateApprovedEnvelope,
  rejectArbitraryAgentWritePayload,
} from "./policy";

export {
  FORBIDDEN_AGENT_SECRET_KINDS,
  issueCredentialHandle,
  getCredentialViewForActor,
  materialiseCredentialForGateway,
  agentCannotAccessSecret,
  clearCredentialHandles,
} from "./credentials";

export {
  evaluateConnectorHealth,
  markConnectorProbe,
  markManualFallback,
  getConnectorHealthSnapshot,
  clearConnectorHealth,
  manualFallbackHint,
} from "./health";

export { decideRetry, withBoundedRetry, withTimeout } from "./retry";

export {
  getCircuitState,
  isCircuitAllowingCalls,
  recordCircuitSuccess,
  recordCircuitFailure,
  forceOpenCircuit,
  clearCircuitBreakers,
  getCircuitSnapshot,
} from "./circuit-breaker";

export {
  externalContentLooksLikeInjection,
  sanitiseExternalContent,
  assertExternalContentIsData,
  refuseExternalAsToolInstruction,
} from "./injection";

export {
  appendConnectorAudit,
  listConnectorAuditEvents,
  clearConnectorAudit,
  findWriteAuditForProposal,
  claimConnectorIdempotency,
  completeConnectorIdempotency,
  getConnectorIdempotency,
  clearConnectorIdempotency,
} from "./audit";

export { readViaConnector, writeViaConnector, peekIdempotency } from "./gateway";

export {
  getConnectorAdapter,
  registerTestConnectorAdapter,
  clearTestConnectorAdapters,
} from "./adapters";
export type {
  ConnectorAdapter,
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "./adapters";

/** Reset in-memory gateway state — tests only. */
export function clearConnectorGatewayState(): void {
  clearConnectorAudit();
  clearConnectorIdempotency();
  clearCredentialHandles();
  clearConnectorHealth();
  clearCircuitBreakers();
  clearTestConnectorAdapters();
}
