import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async (input: { action: string }) => ({
    id: `receipt-${input.action}`,
  })),
}));

vi.mock("@/lib/authority/participant-authority-service", () => ({
  hasParticipantAuthority: vi.fn(async () => false),
}));

vi.mock("@/lib/platform/multi-tenant-admin/tenant-service", () => ({
  userCanAccessTenant: vi.fn(async () => true),
  assertTenantAccess: vi.fn(async () => undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      findMany: vi.fn(),
    },
    participantAuthorityGrant: {
      findFirst: vi.fn(),
    },
    governedActionEnvelope: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  assertNavigatorPilotAccess,
  navigatorAccessErrorCode,
} from "@/lib/ai/navigator/access";
import {
  approveGovernedActionEnvelope,
  toPublicGovernedEnvelope,
} from "@/lib/ai/navigator/envelopes/service";
import { NAVIGATOR_CONSENT_PURPOSE } from "@/lib/ai/navigator/consent-gate";
import {
  clearCapabilityKillSwitch,
  engageCapabilityKillSwitch,
} from "@/lib/ai/platform";
import { hasParticipantAuthority } from "@/lib/authority/participant-authority-service";
import { userCanAccessTenant } from "@/lib/platform/multi-tenant-admin/tenant-service";
import { prisma } from "@/lib/prisma";

const FLAG_KEYS = [
  "MAPABLE_NAVIGATOR_PILOT_ENABLED",
  "MAPABLE_NAVIGATOR_PILOT_ENVELOPES",
] as const;

function clearFlags() {
  for (const key of FLAG_KEYS) delete process.env[key];
}

describe("Navigator Phase 6a — pilot access", () => {
  beforeEach(() => {
    vi.mocked(userCanAccessTenant).mockResolvedValue(true);
    vi.mocked(hasParticipantAuthority).mockResolvedValue(false);
    vi.mocked(createAuditEvent).mockClear();
  });

  it("denies when actor is not a tenant member", async () => {
    vi.mocked(userCanAccessTenant).mockResolvedValue(false);
    const result = await assertNavigatorPilotAccess({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "tenant_forbidden" });
    expect(navigatorAccessErrorCode("tenant_forbidden")).toBe(
      "TENANT_FORBIDDEN",
    );
  });

  it("denies when actor is not the participant and delegation is off", async () => {
    const result = await assertNavigatorPilotAccess({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "other",
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("allows participant who is a tenant member", async () => {
    const result = await assertNavigatorPilotAccess({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      silent: true,
    });
    expect(result).toEqual({ ok: true, viaDelegation: false });
  });

  it("allows scoped delegate when allowDelegation is true", async () => {
    vi.mocked(hasParticipantAuthority).mockResolvedValue(true);
    const result = await assertNavigatorPilotAccess({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "delegate-1",
      allowDelegation: true,
      delegationAction: "match",
      silent: true,
    });
    expect(result).toEqual({ ok: true, viaDelegation: true });
    expect(hasParticipantAuthority).toHaveBeenCalledWith(
      expect.objectContaining({
        participantId: "p1",
        actorUserId: "delegate-1",
        domain: "navigator",
        action: "match",
      }),
    );
  });
});

describe("Navigator Phase 6a — envelope consent re-verify and public shape", () => {
  beforeEach(() => {
    clearFlags();
    clearCapabilityKillSwitch("navigator.provider_search.draft_service_request");
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_ENVELOPES = "true";
    vi.mocked(prisma.consentRecord.findMany).mockReset();
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockReset();
    vi.mocked(prisma.governedActionEnvelope.updateMany).mockReset();
    vi.mocked(prisma.governedActionEnvelope.findUniqueOrThrow).mockReset();
    vi.mocked(createAuditEvent).mockClear();
  });

  afterEach(() => {
    clearFlags();
    clearCapabilityKillSwitch("navigator.provider_search.draft_service_request");
  });

  const proposed = {
    id: "env-6a",
    tenantId: "t1",
    participantId: "p1",
    initiatingUserId: "p1",
    capabilityKey: "navigator.provider_search.draft_service_request",
    action: "create_service_request_draft" as const,
    payload: {
      serviceType: "support",
      locationLabel: "Sydney",
      providerOutletIds: ["o1"],
    },
    payloadHash: "hash",
    evidenceRefs: [] as string[],
    sourceRefs: [] as string[],
    modelVersion: null,
    promptVersion: null,
    toolVersion: null,
    consentReceiptId: "receipt-1",
    requiredApproverRole: "participant",
    nonce: "nonce-6a-value-abcdef123456",
    status: "proposed" as const,
    approvalReason: null,
    rejectionReason: null,
    executionResult: null,
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    auditEventIds: [] as string[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("omits nonce from public envelope projection", () => {
    const publicEnvelope = toPublicGovernedEnvelope(proposed);
    expect(publicEnvelope).not.toHaveProperty("nonce");
    expect(publicEnvelope.id).toBe("env-6a");
  });

  it("re-verifies consent and ignores caller consentStillValid=true", async () => {
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValue({
      ...proposed,
      payloadJson: proposed.payload,
    } as never);
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([]);

    await expect(
      approveGovernedActionEnvelope({
        envelopeId: proposed.id,
        tenantId: "t1",
        participantId: "p1",
        approverUserId: "p1",
        approverRole: "participant",
        consentStillValid: true,
      }),
    ).rejects.toThrow("NAVIGATOR_ENVELOPE_CONSENT_INVALID");
  });

  it("blocks approve when capability kill switch engages mid-flow", async () => {
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValue({
      ...proposed,
      payloadJson: proposed.payload,
    } as never);
    engageCapabilityKillSwitch(
      "navigator.provider_search.draft_service_request",
    );

    await expect(
      approveGovernedActionEnvelope({
        envelopeId: proposed.id,
        tenantId: "t1",
        participantId: "p1",
        approverUserId: "p1",
        approverRole: "participant",
      }),
    ).rejects.toThrow("NAVIGATOR_GATE_DENIED:capability_kill_switch");
  });

  it("blocks atomic replay when updateMany consumes zero rows", async () => {
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValue({
      ...proposed,
      payloadJson: proposed.payload,
    } as never);
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c-ok",
        purpose: NAVIGATOR_CONSENT_PURPOSE,
        status: "active",
        expiryDate: new Date(Date.now() + 60_000),
        dataScope: null,
        sourceAction: null,
        createdAt: new Date(),
      } as never,
    ]);
    vi.mocked(prisma.governedActionEnvelope.updateMany).mockResolvedValue({
      count: 0,
    } as never);

    await expect(
      approveGovernedActionEnvelope({
        envelopeId: proposed.id,
        tenantId: "t1",
        participantId: "p1",
        approverUserId: "p1",
        approverRole: "participant",
      }),
    ).rejects.toThrow("NAVIGATOR_ENVELOPE_REPLAY");
  });
});
