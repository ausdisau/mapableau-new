import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  agentCannotAccessSecret,
  clearConnectorGatewayState,
  FORBIDDEN_AGENT_SECRET_KINDS,
  getCredentialViewForActor,
  issueCredentialHandle,
  materialiseCredentialForGateway,
} from "@/lib/ai/platform/connector-gateway";

describe("Connector gateway credentials", () => {
  beforeEach(() => {
    clearConnectorGatewayState();
  });

  afterEach(() => {
    clearConnectorGatewayState();
  });

  it("agent cannot access secret material — only opaque denial", () => {
    const handle = issueCredentialHandle("stripe_billing");
    expect(handle).not.toBeNull();
    const denied = agentCannotAccessSecret(handle!.handleId, {
      actorId: "agent-1",
      actorType: "agent",
      role: "agent",
    });
    expect(denied).toBe(true);

    const view = getCredentialViewForActor(handle!.handleId, {
      actorId: "agent-1",
      actorType: "agent",
      role: "agent",
    });
    expect(view.ok).toBe(false);
    if (!view.ok) {
      expect(view.reason).toBe("agent_credential_access_denied");
      expect(view.deniedKinds).toEqual([...FORBIDDEN_AGENT_SECRET_KINDS]);
    }
  });

  it("gateway role may materialise presence metadata without exposing values", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_not_a_real_secret";
    const handle = issueCredentialHandle("stripe_billing");
    const materialised = materialiseCredentialForGateway(handle!.handleId, {
      actorId: "gateway",
      actorType: "system_service",
      role: "gateway",
    });
    expect(materialised.ok).toBe(true);
    if (materialised.ok) {
      expect(materialised.present).toBe(true);
      expect(materialised.envVarName).toBe("STRIPE_SECRET_KEY");
      expect(JSON.stringify(materialised)).not.toContain("sk_test_not_a_real_secret");
    }
    delete process.env.STRIPE_SECRET_KEY;
  });

  it("non-gateway roles cannot materialise credentials", () => {
    const handle = issueCredentialHandle("email_sendgrid");
    const result = materialiseCredentialForGateway(handle!.handleId, {
      actorId: "kernel",
      actorType: "system_service",
      role: "kernel",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("role_not_gateway");
  });
});
