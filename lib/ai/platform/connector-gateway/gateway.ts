import { randomUUID } from "node:crypto";

import { isConnectorGatewayOperational } from "@/lib/config/connector-gateway";

import { getConnectorAdapter } from "./adapters";
import {
  appendConnectorAudit,
  claimConnectorIdempotency,
  completeConnectorIdempotency,
  getConnectorIdempotency,
} from "./audit";
import {
  isCircuitAllowingCalls,
  recordCircuitFailure,
  recordCircuitSuccess,
} from "./circuit-breaker";
import { issueCredentialHandle } from "./credentials";
import {
  evaluateConnectorHealth,
  manualFallbackHint,
  markConnectorProbe,
  markManualFallback,
} from "./health";
import { refuseExternalAsToolInstruction } from "./injection";
import { evaluateReadPolicy, evaluateWritePolicy } from "./policy";
import { requireMapAbleConnector } from "./registry";
import { withBoundedRetry } from "./retry";
import {
  connectorReadRequestSchema,
  connectorWriteRequestSchema,
} from "./schemas";
import type {
  ConnectorInvokeResult,
  ConnectorReadRequest,
  ConnectorWriteRequest,
} from "./types";

export async function readViaConnector(
  raw: ConnectorReadRequest,
): Promise<ConnectorInvokeResult> {
  const parsed = connectorReadRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      status: "rejected",
      reasonCode: "arbitrary_payload_rejected",
      detail: parsed.error.message,
      healthState: "disabled",
      attemptCount: 0,
    };
  }
  const request = parsed.data;

  const policy = evaluateReadPolicy(request);
  const healthState = evaluateConnectorHealth(
    request.connectorKey,
    isConnectorGatewayOperational(),
  );

  if (!policy.allowed) {
    const audit = appendConnectorAudit({
      connectorKey: request.connectorKey,
      operation: request.operation,
      direction: "read",
      tenantId: request.tenant.tenantId,
      actorId: request.actor.actorId,
      actorRole: request.actor.role,
      purpose: request.purpose,
      outcome: "rejected",
      reasonCode: policy.reasonCode,
    });
    return {
      ok: false,
      status: "rejected",
      reasonCode: policy.reasonCode,
      detail: policy.detail,
      healthState,
      attemptCount: 0,
      auditId: audit.auditId,
      manualFallbackHint:
        policy.reasonCode === "connector_unavailable" ||
        policy.reasonCode === "circuit_open" ||
        policy.reasonCode === "connector_kill_switch"
          ? manualFallbackHint(request.connectorKey)
          : undefined,
    };
  }

  if (
    !isCircuitAllowingCalls(request.connectorKey) ||
    healthState === "circuit_open"
  ) {
    markManualFallback(request.connectorKey, true);
    const audit = appendConnectorAudit({
      connectorKey: request.connectorKey,
      operation: request.operation,
      direction: "read",
      tenantId: request.tenant.tenantId,
      actorId: request.actor.actorId,
      actorRole: request.actor.role,
      purpose: request.purpose,
      outcome: "degraded",
      reasonCode: "circuit_open",
    });
    return {
      ok: false,
      status: "degraded",
      reasonCode: "circuit_open",
      healthState: "circuit_open",
      attemptCount: 0,
      auditId: audit.auditId,
      manualFallbackHint: manualFallbackHint(request.connectorKey),
    };
  }

  issueCredentialHandle(request.connectorKey);

  const connector = requireMapAbleConnector(request.connectorKey);
  const adapter = getConnectorAdapter(request.connectorKey);
  if (!adapter.read) {
    return {
      ok: false,
      status: "rejected",
      reasonCode: "mode_not_allowed",
      healthState,
      attemptCount: 0,
    };
  }

  try {
    const { result, attemptCount } = await withBoundedRetry({
      policy: connector.retryPolicy,
      timeoutMs: connector.timeoutMs,
      operation: async () =>
        adapter.read!(request.operation, request.scope, {
          tenantId: request.tenant.tenantId,
          participantId: request.tenant.participantId,
          purpose: request.purpose,
          actorId: request.actor.actorId,
          operation: request.operation,
          mockOnly: true,
        }),
    });

    for (const record of result.records) {
      const check = refuseExternalAsToolInstruction({
        contentKind: record.contentKind,
      });
      if (!check.allowed) {
        return {
          ok: false,
          status: "rejected",
          reasonCode: "injection_content_quarantined",
          healthState,
          attemptCount,
        };
      }
    }

    recordCircuitSuccess(request.connectorKey);
    markConnectorProbe(request.connectorKey, "ok");

    const audit = appendConnectorAudit({
      connectorKey: request.connectorKey,
      operation: request.operation,
      direction: "read",
      tenantId: request.tenant.tenantId,
      actorId: request.actor.actorId,
      actorRole: request.actor.role,
      purpose: request.purpose,
      outcome: "completed",
    });

    return {
      ok: true,
      status: "completed",
      data: result.data,
      records: result.records,
      healthState: evaluateConnectorHealth(
        request.connectorKey,
        isConnectorGatewayOperational(),
      ),
      attemptCount,
      auditId: audit.auditId,
    };
  } catch (err) {
    recordCircuitFailure(request.connectorKey);
    markConnectorProbe(
      request.connectorKey,
      "error",
      err instanceof Error ? err.message : "read_failed",
    );
    const isTimeout = err instanceof Error && /timeout/i.test(err.message);
    const audit = appendConnectorAudit({
      connectorKey: request.connectorKey,
      operation: request.operation,
      direction: "read",
      tenantId: request.tenant.tenantId,
      actorId: request.actor.actorId,
      actorRole: request.actor.role,
      purpose: request.purpose,
      outcome: "failed",
      reasonCode: isTimeout ? "timeout" : "connector_unavailable",
    });
    return {
      ok: false,
      status: "degraded",
      reasonCode: isTimeout ? "timeout" : "connector_unavailable",
      detail: err instanceof Error ? err.message : "read_failed",
      healthState: evaluateConnectorHealth(
        request.connectorKey,
        isConnectorGatewayOperational(),
      ),
      attemptCount: connector.retryPolicy.maxAttempts,
      auditId: audit.auditId,
      manualFallbackHint: manualFallbackHint(request.connectorKey),
    };
  }
}

export async function writeViaConnector(
  raw: ConnectorWriteRequest,
): Promise<ConnectorInvokeResult> {
  const parsed = connectorWriteRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      status: "rejected",
      reasonCode: "write_requires_approved_envelope",
      detail: parsed.error.message,
      healthState: "disabled",
      attemptCount: 0,
    };
  }
  const request = parsed.data;

  const policy = evaluateWritePolicy(request);
  const healthState = evaluateConnectorHealth(
    request.connectorKey,
    isConnectorGatewayOperational(),
  );

  if (!policy.allowed) {
    const audit = appendConnectorAudit({
      connectorKey: request.connectorKey,
      operation: request.operation,
      direction: "write",
      tenantId: request.tenant.tenantId,
      actorId: request.actor.actorId,
      actorRole: request.actor.role,
      proposalId: request.approvedEnvelope.proposalId,
      approvalId: request.approvedEnvelope.approvalId,
      payloadHash: request.approvedEnvelope.payloadHash,
      outcome: "rejected",
      reasonCode: policy.reasonCode,
    });
    return {
      ok: false,
      status: "rejected",
      reasonCode: policy.reasonCode,
      detail: policy.detail,
      healthState,
      attemptCount: 0,
      auditId: audit.auditId,
    };
  }

  if (
    !isCircuitAllowingCalls(request.connectorKey) ||
    healthState === "circuit_open"
  ) {
    markManualFallback(request.connectorKey, true);
    return {
      ok: false,
      status: "degraded",
      reasonCode: "circuit_open",
      healthState: "circuit_open",
      attemptCount: 0,
      manualFallbackHint: manualFallbackHint(request.connectorKey),
    };
  }

  const connector = requireMapAbleConnector(request.connectorKey);
  const idempotencyKey =
    request.idempotencyKey ??
    `${request.approvedEnvelope.approvalId}:${request.approvedEnvelope.payloadHash}`;

  if (connector.idempotencySupport) {
    const claim = claimConnectorIdempotency({
      tenantId: request.tenant.tenantId,
      key: idempotencyKey,
      connectorKey: request.connectorKey,
    });
    if (!claim.claimed) {
      if (claim.existing.resultRef) {
        const audit = appendConnectorAudit({
          connectorKey: request.connectorKey,
          operation: request.operation,
          direction: "write",
          tenantId: request.tenant.tenantId,
          actorId: request.actor.actorId,
          actorRole: request.actor.role,
          proposalId: request.approvedEnvelope.proposalId,
          approvalId: request.approvedEnvelope.approvalId,
          payloadHash: request.approvedEnvelope.payloadHash,
          outcome: "replayed",
          reasonCode: "idempotency_replay",
        });
        return {
          ok: true,
          status: "replayed",
          reasonCode: "idempotency_replay",
          data: { resultRef: claim.existing.resultRef },
          healthState,
          attemptCount: 0,
          idempotentReplay: true,
          auditId: audit.auditId,
        };
      }
      return {
        ok: false,
        status: "rejected",
        reasonCode: "idempotency_conflict",
        healthState,
        attemptCount: 0,
      };
    }
  }

  issueCredentialHandle(request.connectorKey);

  const adapter = getConnectorAdapter(request.connectorKey);
  if (!adapter.write) {
    return {
      ok: false,
      status: "rejected",
      reasonCode: "mode_not_allowed",
      healthState,
      attemptCount: 0,
    };
  }

  try {
    const { result, attemptCount } = await withBoundedRetry({
      policy: connector.retryPolicy,
      timeoutMs: connector.timeoutMs,
      operation: async () =>
        adapter.write!(request.operation, request.approvedEnvelope, {
          tenantId: request.tenant.tenantId,
          participantId: request.tenant.participantId,
          actorId: request.actor.actorId,
          operation: request.operation,
          mockOnly: true,
        }),
    });

    const resultRef = String(
      result.data.messageId ??
        result.data.sessionId ??
        result.data.eventId ??
        randomUUID(),
    );
    if (connector.idempotencySupport) {
      completeConnectorIdempotency({
        tenantId: request.tenant.tenantId,
        key: idempotencyKey,
        resultRef,
      });
    }

    recordCircuitSuccess(request.connectorKey);
    markConnectorProbe(request.connectorKey, "ok");

    const audit = appendConnectorAudit({
      connectorKey: request.connectorKey,
      operation: request.operation,
      direction: "write",
      tenantId: request.tenant.tenantId,
      actorId: request.actor.actorId,
      actorRole: request.actor.role,
      proposalId: request.approvedEnvelope.proposalId,
      approvalId: request.approvedEnvelope.approvalId,
      payloadHash: connector.auditPolicy.includePayloadHash
        ? request.approvedEnvelope.payloadHash
        : undefined,
      outcome: "completed",
    });

    return {
      ok: true,
      status: "completed",
      data: result.data,
      healthState: evaluateConnectorHealth(
        request.connectorKey,
        isConnectorGatewayOperational(),
      ),
      attemptCount,
      auditId: audit.auditId,
    };
  } catch (err) {
    recordCircuitFailure(request.connectorKey);
    markConnectorProbe(
      request.connectorKey,
      "error",
      err instanceof Error ? err.message : "write_failed",
    );
    const isTimeout = err instanceof Error && /timeout/i.test(err.message);
    const audit = appendConnectorAudit({
      connectorKey: request.connectorKey,
      operation: request.operation,
      direction: "write",
      tenantId: request.tenant.tenantId,
      actorId: request.actor.actorId,
      actorRole: request.actor.role,
      proposalId: request.approvedEnvelope.proposalId,
      approvalId: request.approvedEnvelope.approvalId,
      payloadHash: request.approvedEnvelope.payloadHash,
      outcome: "failed",
      reasonCode: isTimeout ? "timeout" : "manual_fallback_required",
    });
    return {
      ok: false,
      status: "degraded",
      reasonCode: isTimeout ? "timeout" : "manual_fallback_required",
      detail: err instanceof Error ? err.message : "write_failed",
      healthState: evaluateConnectorHealth(
        request.connectorKey,
        isConnectorGatewayOperational(),
      ),
      attemptCount: connector.retryPolicy.maxAttempts,
      auditId: audit.auditId,
      manualFallbackHint: manualFallbackHint(request.connectorKey),
    };
  }
}

export function peekIdempotency(tenantId: string, key: string) {
  return getConnectorIdempotency({ tenantId, key });
}
