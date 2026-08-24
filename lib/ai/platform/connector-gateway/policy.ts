import {
  connectorGatewayConfig,
  isConnectorEnabled,
  isConnectorGatewayOperational,
} from "@/lib/config/connector-gateway";

import { getMapAbleConnector } from "./registry";
import type {
  ApprovedActionEnvelope,
  ConnectorActor,
  ConnectorPolicyReasonCode,
  ConnectorReadRequest,
  ConnectorTenantContext,
  ConnectorWriteRequest,
  MapAbleConnector,
  MapAbleConnectorKey,
} from "./types";

export type ConnectorPolicyDecision = {
  allowed: boolean;
  reasonCode?: ConnectorPolicyReasonCode;
  detail?: string;
  connector?: MapAbleConnector;
};

function envKillSwitch(key: string): boolean {
  return process.env[key] === "true";
}

function hasRequiredConsent(required: string[], provided: string[]): boolean {
  if (required.length === 0) return true;
  const set = new Set(provided);
  return required.every((scope) => set.has(scope));
}

function assertTenantBound(tenant: ConnectorTenantContext): boolean {
  return Boolean(tenant.tenantId);
}

export function evaluateGatewayMasterPolicy(): ConnectorPolicyDecision {
  if (!connectorGatewayConfig.enabled) {
    return { allowed: false, reasonCode: "gateway_disabled" };
  }
  if (connectorGatewayConfig.killSwitchEngaged) {
    return { allowed: false, reasonCode: "gateway_kill_switch" };
  }
  if (!isConnectorGatewayOperational()) {
    return { allowed: false, reasonCode: "gateway_disabled" };
  }
  return { allowed: true };
}

export function evaluateConnectorAvailability(
  key: MapAbleConnectorKey,
): ConnectorPolicyDecision {
  const master = evaluateGatewayMasterPolicy();
  if (!master.allowed) return master;

  const connector = getMapAbleConnector(key);
  if (!connector) {
    return {
      allowed: false,
      reasonCode: "connector_unavailable",
      detail: "unknown",
    };
  }

  if (envKillSwitch(connector.killSwitchKey)) {
    return {
      allowed: false,
      reasonCode: "connector_kill_switch",
      connector,
    };
  }

  if (!isConnectorEnabled(key)) {
    return {
      allowed: false,
      reasonCode: "connector_disabled",
      connector,
    };
  }

  return { allowed: true, connector };
}

export function evaluateReadPolicy(
  request: ConnectorReadRequest,
): ConnectorPolicyDecision {
  const availability = evaluateConnectorAvailability(request.connectorKey);
  if (!availability.allowed || !availability.connector) return availability;

  const connector = availability.connector;

  if (connector.mode === "write") {
    return {
      allowed: false,
      reasonCode: "mode_not_allowed",
      detail: "connector_is_write_only",
      connector,
    };
  }

  if (!connector.allowedOperations.includes(request.operation)) {
    return {
      allowed: false,
      reasonCode: "operation_not_allowed",
      connector,
    };
  }

  if (!request.purpose?.trim()) {
    return {
      allowed: false,
      reasonCode: "missing_consent",
      detail: "purpose_required",
      connector,
    };
  }

  if (!assertTenantBound(request.tenant)) {
    return {
      allowed: false,
      reasonCode: "tenant_mismatch",
      connector,
    };
  }

  if (
    !hasRequiredConsent(connector.requiredConsentScopes, request.consentScopes)
  ) {
    return {
      allowed: false,
      reasonCode: "missing_consent",
      connector,
    };
  }

  return { allowed: true, connector };
}

export function evaluateWritePolicy(
  request: ConnectorWriteRequest,
): ConnectorPolicyDecision {
  const availability = evaluateConnectorAvailability(request.connectorKey);
  if (!availability.allowed || !availability.connector) return availability;

  const connector = availability.connector;

  if (connector.mode === "read") {
    return {
      allowed: false,
      reasonCode: "mode_not_allowed",
      detail: "connector_is_read_only",
      connector,
    };
  }

  if (!connector.allowedOperations.includes(request.operation)) {
    return {
      allowed: false,
      reasonCode: "operation_not_allowed",
      connector,
    };
  }

  const envelope = request.approvedEnvelope;
  if (!envelope) {
    return {
      allowed: false,
      reasonCode: "write_requires_approved_envelope",
      connector,
    };
  }

  const envelopeCheck = validateApprovedEnvelope(envelope, request.tenant);
  if (!envelopeCheck.allowed) {
    return { ...envelopeCheck, connector };
  }

  if (
    !hasRequiredConsent(connector.requiredConsentScopes, request.consentScopes)
  ) {
    return {
      allowed: false,
      reasonCode: "missing_consent",
      connector,
    };
  }

  if (
    request.actor.role === "agent" &&
    !isKernelMediatedWrite(request.actor, envelope)
  ) {
    return {
      allowed: false,
      reasonCode: "arbitrary_payload_rejected",
      detail: "agent_writes_must_be_kernel_authorised",
      connector,
    };
  }

  return { allowed: true, connector };
}

function isKernelMediatedWrite(
  actor: ConnectorActor,
  envelope: ApprovedActionEnvelope,
): boolean {
  void envelope;
  return (
    actor.role === "kernel" ||
    actor.role === "gateway" ||
    actor.role === "service" ||
    actor.role === "human" ||
    actor.actorType === "authorised_human" ||
    actor.actorType === "system_service"
  );
}

export function validateApprovedEnvelope(
  envelope: ApprovedActionEnvelope,
  tenant: ConnectorTenantContext,
): ConnectorPolicyDecision {
  if (
    !envelope.proposalId ||
    !envelope.approvalId ||
    !envelope.nonce ||
    !envelope.payloadHash ||
    !envelope.actionKey
  ) {
    return {
      allowed: false,
      reasonCode: "approved_envelope_invalid",
      detail: "incomplete_envelope",
    };
  }

  if (
    tenant.participantId &&
    envelope.participantId &&
    tenant.participantId !== envelope.participantId
  ) {
    return {
      allowed: false,
      reasonCode: "tenant_mismatch",
      detail: "envelope_participant_mismatch",
    };
  }

  if (
    typeof envelope.approvedPayload !== "object" ||
    envelope.approvedPayload === null ||
    Array.isArray(envelope.approvedPayload)
  ) {
    return {
      allowed: false,
      reasonCode: "arbitrary_payload_rejected",
    };
  }

  return { allowed: true };
}

export function rejectArbitraryAgentWritePayload(input: {
  hasApprovedEnvelope: boolean;
  actorRole: ConnectorActor["role"];
}): ConnectorPolicyDecision {
  if (!input.hasApprovedEnvelope) {
    return {
      allowed: false,
      reasonCode: "write_requires_approved_envelope",
    };
  }
  if (input.actorRole === "agent") {
    return {
      allowed: false,
      reasonCode: "arbitrary_payload_rejected",
    };
  }
  return { allowed: true };
}
