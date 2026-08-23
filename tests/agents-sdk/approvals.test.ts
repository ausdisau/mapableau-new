import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async () => ({ id: "receipt-1" })),
}));

vi.mock("@/lib/authority/participant-authority-service", () => ({
  hasParticipantAuthority: vi.fn(async () => false),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: { findMany: vi.fn(async () => []) },
    governedActionEnvelope: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import {
  buildDefaultRunContext,
  decryptRunStatePayload,
  encryptRunStatePayload,
  resumeManagerTurnFromEnvelope,
} from "@/lib/ai/platform/agents-sdk";
import { validateGovernedEnvelopePayload } from "@/lib/ai/navigator/envelopes/schema";

describe("Agents SDK approvals bridge", () => {
  beforeEach(() => {
    vi.stubEnv("MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK", "true");
    vi.stubEnv("NODE_ENV", "test");
  });

  it("validates agents_sdk_run_pause envelope payload shape", () => {
    const encrypted = encryptRunStatePayload('{"paused":true}');
    const payload = validateGovernedEnvelopePayload("agents_sdk_run_pause", {
      encryptedRunState: encrypted,
      interruptionCount: 1,
      purpose: "navigator.provider_search",
    });
    expect(payload.encryptedRunState).toBe(encrypted);
    expect(decryptRunStatePayload(String(payload.encryptedRunState))).toBe(
      '{"paused":true}',
    );
  });

  it("resume fails closed when envelope state missing (IDOR)", async () => {
    const result = await resumeManagerTurnFromEnvelope({
      approvalEnvelopeId: "missing-env",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      consentStillValid: true,
      approveInterruptions: true,
      silent: true,
    });
    expect(result.status).toBe("blocked");
    if (result.status === "blocked") {
      expect(result.reason).toBe("approval_state_not_found");
    }
  });

  it("resume fails closed when approval rejected", async () => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    const result = await resumeManagerTurnFromEnvelope({
      approvalEnvelopeId: "env-1",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      consentStillValid: true,
      approveInterruptions: false,
      silent: true,
    });
    expect(result.status).toBe("blocked");
    if (result.status === "blocked") {
      expect(result.reason).toBe("approval_rejected");
    }
  });

  it("does not expose raw tenant/participant ids in encrypted blob", () => {
    const ctx = buildDefaultRunContext({
      tenantId: "secret-tenant",
      participantId: "secret-participant",
      actorUserId: "secret-participant",
    });
    const encrypted = encryptRunStatePayload(
      JSON.stringify({ tenantId: ctx.tenantId, participantId: ctx.participantId }),
    );
    expect(encrypted).not.toContain("secret-tenant");
    expect(encrypted).not.toContain("secret-participant");
  });
});
