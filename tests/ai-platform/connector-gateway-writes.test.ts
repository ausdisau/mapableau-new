import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  clearConnectorGatewayState,
  evaluateWritePolicy,
  findWriteAuditForProposal,
  listConnectorAuditEvents,
  rejectArbitraryAgentWritePayload,
  writeViaConnector,
} from "@/lib/ai/platform/connector-gateway";
import type { ApprovedActionEnvelope } from "@/lib/ai/platform/connector-gateway";

function enableGateway() {
  process.env.MAPABLE_CONNECTOR_GATEWAY_ENABLED = "true";
  process.env.MAPABLE_CONNECTOR_EMAIL_ENABLED = "true";
  process.env.MAPABLE_CONNECTOR_MESSAGING_ENABLED = "true";
  delete process.env.MAPABLE_CONNECTOR_GATEWAY_KILL_SWITCH;
  delete process.env.MAPABLE_CONNECTOR_EMAIL_KILL_SWITCH;
}

function approvedEnvelope(
  overrides?: Partial<ApprovedActionEnvelope>,
): ApprovedActionEnvelope {
  return {
    proposalId: randomUUID(),
    approvalId: randomUUID(),
    nonce: `nonce_${randomUUID()}`,
    payloadHash: "a".repeat(64),
    actionKey: "send_provider_message",
    participantId: "participant-1",
    approvedPayload: {
      to: "user@example.com",
      subject: "Update",
      body: "Your visit is confirmed",
    },
    ...overrides,
  };
}

describe("Connector gateway writes", () => {
  beforeEach(() => {
    clearConnectorGatewayState();
    enableGateway();
  });

  afterEach(() => {
    clearConnectorGatewayState();
    delete process.env.MAPABLE_CONNECTOR_GATEWAY_ENABLED;
    delete process.env.MAPABLE_CONNECTOR_EMAIL_ENABLED;
    delete process.env.MAPABLE_CONNECTOR_MESSAGING_ENABLED;
  });

  it("write requires approved envelope — rejects missing envelope at schema", async () => {
    const result = await writeViaConnector({
      connectorKey: "email_sendgrid",
      operation: "send_transactional_email",
      actor: {
        actorId: "agent-1",
        actorType: "agent",
        role: "agent",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: "participant-1",
        organisationId: null,
      },
      consentScopes: ["notifications.email"],
      // @ts-expect-error intentional missing envelope
      approvedEnvelope: undefined,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe("write_requires_approved_envelope");
  });

  it("rejects arbitrary agent write payloads", () => {
    const decision = rejectArbitraryAgentWritePayload({
      hasApprovedEnvelope: false,
      actorRole: "agent",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reasonCode).toBe("write_requires_approved_envelope");

    const agentWithEnvelope = rejectArbitraryAgentWritePayload({
      hasApprovedEnvelope: true,
      actorRole: "agent",
    });
    expect(agentWithEnvelope.allowed).toBe(false);
    expect(agentWithEnvelope.reasonCode).toBe("arbitrary_payload_rejected");
  });

  it("agent role cannot invoke write even with envelope (kernel must mediate)", async () => {
    const envelope = approvedEnvelope();
    const policy = evaluateWritePolicy({
      connectorKey: "email_sendgrid",
      operation: "send_transactional_email",
      actor: { actorId: "agent-1", actorType: "agent", role: "agent" },
      tenant: {
        tenantId: "tenant-a",
        participantId: "participant-1",
        organisationId: null,
      },
      consentScopes: ["notifications.email"],
      approvedEnvelope: envelope,
    });
    expect(policy.allowed).toBe(false);
    expect(policy.reasonCode).toBe("arbitrary_payload_rejected");
  });

  it("kernel-mediated write succeeds and records write audit", async () => {
    const envelope = approvedEnvelope();
    const result = await writeViaConnector({
      connectorKey: "email_sendgrid",
      operation: "send_transactional_email",
      actor: {
        actorId: "kernel-service",
        actorType: "system_service",
        role: "kernel",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: "participant-1",
        organisationId: null,
      },
      consentScopes: ["notifications.email"],
      approvedEnvelope: envelope,
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.auditId).toBeTruthy();

    const audit = findWriteAuditForProposal(envelope.proposalId);
    expect(audit).toBeDefined();
    expect(audit?.payloadHash).toBe(envelope.payloadHash);
    expect(audit?.direction).toBe("write");
    expect(audit?.outcome).toBe("completed");

    const writes = listConnectorAuditEvents({
      direction: "write",
      tenantId: "tenant-a",
    });
    expect(writes.length).toBeGreaterThanOrEqual(1);
  });

  it("enforces consent scope on writes", async () => {
    const result = await writeViaConnector({
      connectorKey: "email_sendgrid",
      operation: "send_transactional_email",
      actor: {
        actorId: "kernel-service",
        actorType: "system_service",
        role: "kernel",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: "participant-1",
        organisationId: null,
      },
      consentScopes: [],
      approvedEnvelope: approvedEnvelope(),
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe("missing_consent");
  });

  it("rejects envelope participant mismatch (tenant separation)", async () => {
    const result = await writeViaConnector({
      connectorKey: "email_sendgrid",
      operation: "send_transactional_email",
      actor: {
        actorId: "kernel-service",
        actorType: "system_service",
        role: "kernel",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: "participant-1",
        organisationId: null,
      },
      consentScopes: ["notifications.email"],
      approvedEnvelope: approvedEnvelope({ participantId: "other-participant" }),
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe("tenant_mismatch");
  });
});
