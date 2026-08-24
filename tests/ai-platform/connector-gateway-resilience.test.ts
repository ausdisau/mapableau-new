import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

import {
  clearConnectorGatewayState,
  decideRetry,
  forceOpenCircuit,
  readViaConnector,
  registerTestConnectorAdapter,
  writeViaConnector,
} from "@/lib/ai/platform/connector-gateway";
import type {
  ApprovedActionEnvelope,
  ConnectorAdapter,
} from "@/lib/ai/platform/connector-gateway";

function enable() {
  process.env.MAPABLE_CONNECTOR_GATEWAY_ENABLED = "true";
  process.env.MAPABLE_CONNECTOR_MAPS_ENABLED = "true";
  process.env.MAPABLE_CONNECTOR_EMAIL_ENABLED = "true";
  process.env.MAPABLE_CONNECTOR_STRIPE_ENABLED = "true";
  delete process.env.MAPABLE_CONNECTOR_GATEWAY_KILL_SWITCH;
  delete process.env.MAPABLE_CONNECTOR_MAPS_KILL_SWITCH;
  delete process.env.MAPABLE_CONNECTOR_EMAIL_KILL_SWITCH;
  delete process.env.MAPABLE_CONNECTOR_STRIPE_KILL_SWITCH;
}

function envelope(): ApprovedActionEnvelope {
  return {
    proposalId: randomUUID(),
    approvalId: randomUUID(),
    nonce: `nonce_${randomUUID()}`,
    payloadHash: "b".repeat(64),
    actionKey: "notify",
    participantId: "participant-1",
    approvedPayload: {
      to: "a@example.com",
      subject: "Hi",
      body: "Hello",
    },
  };
}

describe("Connector gateway resilience", () => {
  beforeEach(() => {
    clearConnectorGatewayState();
    enable();
  });

  afterEach(() => {
    clearConnectorGatewayState();
    delete process.env.MAPABLE_CONNECTOR_GATEWAY_ENABLED;
    delete process.env.MAPABLE_CONNECTOR_MAPS_ENABLED;
    delete process.env.MAPABLE_CONNECTOR_EMAIL_ENABLED;
    delete process.env.MAPABLE_CONNECTOR_STRIPE_ENABLED;
    delete process.env.MAPABLE_CONNECTOR_MAPS_KILL_SWITCH;
    delete process.env.MAPABLE_CONNECTOR_GATEWAY_KILL_SWITCH;
  });

  it("connector unavailable / circuit open degrades safely with manual fallback", async () => {
    forceOpenCircuit("maps_geocode");
    const result = await readViaConnector({
      connectorKey: "maps_geocode",
      operation: "geocode_lookup",
      purpose: "nav",
      actor: {
        actorId: "svc",
        actorType: "system_service",
        role: "service",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: null,
        organisationId: null,
      },
      consentScopes: ["maps.read"],
      scope: { query: "x" },
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("degraded");
    expect(result.reasonCode).toBe("circuit_open");
    expect(result.manualFallbackHint).toMatch(/non-AI/);
  });

  it("kill switch fails closed", async () => {
    process.env.MAPABLE_CONNECTOR_MAPS_KILL_SWITCH = "true";
    const result = await readViaConnector({
      connectorKey: "maps_geocode",
      operation: "geocode_lookup",
      purpose: "nav",
      actor: {
        actorId: "svc",
        actorType: "system_service",
        role: "service",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: null,
        organisationId: null,
      },
      consentScopes: ["maps.read"],
      scope: { query: "x" },
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe("connector_kill_switch");
  });

  it("idempotent retry returns replay without double side-effect", async () => {
    let invocations = 0;
    const testAdapter: ConnectorAdapter = {
      key: "email_sendgrid",
      async write(_op, _envelope, _ctx) {
        invocations += 1;
        return {
          data: { messageId: "msg_fixed" },
          records: [],
          outcomeDetail: "sent",
        };
      },
    };
    registerTestConnectorAdapter("email_sendgrid", testAdapter);

    const env = envelope();
    const idempotencyKey = `idem_${env.approvalId}`;
    const first = await writeViaConnector({
      connectorKey: "email_sendgrid",
      operation: "send_transactional_email",
      actor: {
        actorId: "kernel",
        actorType: "system_service",
        role: "kernel",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: "participant-1",
        organisationId: null,
      },
      consentScopes: ["notifications.email"],
      approvedEnvelope: env,
      idempotencyKey,
    });
    expect(first.ok).toBe(true);
    expect(first.status).toBe("completed");

    const second = await writeViaConnector({
      connectorKey: "email_sendgrid",
      operation: "send_transactional_email",
      actor: {
        actorId: "kernel",
        actorType: "system_service",
        role: "kernel",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: "participant-1",
        organisationId: null,
      },
      consentScopes: ["notifications.email"],
      approvedEnvelope: env,
      idempotencyKey,
    });
    expect(second.ok).toBe(true);
    expect(second.status).toBe("replayed");
    expect(second.idempotentReplay).toBe(true);
    expect(invocations).toBe(1);
  });

  it("bounded retry never exceeds maxAttempts", () => {
    const decision = decideRetry({
      policy: {
        maxAttempts: 2,
        baseDelayMs: 10,
        maxDelayMs: 100,
        retryOn: ["timeout"],
      },
      attempt: 2,
      failureClass: "timeout",
    });
    expect(decision.shouldRetry).toBe(false);
    expect(decision.reason).toBe("max_attempts_exhausted");
  });

  it("timeout recovery degrades with fallback hint", async () => {
    const slowAdapter: ConnectorAdapter = {
      key: "maps_geocode",
      async read() {
        await new Promise((r) => setTimeout(r, 50));
        throw Object.assign(new Error("timeout"), { failureClass: "timeout" });
      },
    };
    // Override timeout via test adapter that always times out quickly through retry path
    registerTestConnectorAdapter("maps_geocode", {
      ...slowAdapter,
      async read() {
        throw Object.assign(new Error("timeout"), { failureClass: "timeout" });
      },
    });

    const result = await readViaConnector({
      connectorKey: "maps_geocode",
      operation: "geocode_lookup",
      purpose: "nav",
      actor: {
        actorId: "svc",
        actorType: "system_service",
        role: "service",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: null,
        organisationId: null,
      },
      consentScopes: ["maps.read"],
      scope: { query: "x" },
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("degraded");
    expect(result.reasonCode).toBe("timeout");
    expect(result.manualFallbackHint).toBeTruthy();
  });

  it("master flag off fails closed", async () => {
    delete process.env.MAPABLE_CONNECTOR_GATEWAY_ENABLED;
    const result = await readViaConnector({
      connectorKey: "maps_geocode",
      operation: "geocode_lookup",
      purpose: "nav",
      actor: {
        actorId: "svc",
        actorType: "system_service",
        role: "service",
      },
      tenant: {
        tenantId: "tenant-a",
        participantId: null,
        organisationId: null,
      },
      consentScopes: ["maps.read"],
      scope: { query: "x" },
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe("gateway_disabled");
  });
});
