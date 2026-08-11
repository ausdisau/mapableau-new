import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    governedActionEnvelope: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    consentReceipt: {
      findFirst: vi.fn(),
    },
    participantAuthorityGrant: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

import {
  approveGovernedActionEnvelope,
  createGovernedActionEnvelope,
  executeGovernedActionEnvelope,
  validateGovernedActionPayload,
} from "@/intelligence/actions/governed-envelope";
import { prisma } from "@/lib/prisma";

describe("Governed action envelopes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT = "true";
  });

  it("schema-validates draft care request payloads", () => {
    expect(() =>
      validateGovernedActionPayload("create_care_request_draft", {
        requestType: "personal_care",
        title: "Draft request",
        description: "Need support",
      }),
    ).not.toThrow();
  });

  it("rejects booking-like action types at the schema boundary", () => {
    expect(() =>
      validateGovernedActionPayload(
        "book_or_cancel_service" as never,
        {},
      ),
    ).toThrow();
  });

  it("prevents replay via nonce and single-use flag", async () => {
    const envelope = {
      id: "env-1",
      tenantId: "tenant-a",
      participantId: "participant-1",
      initiatingUserId: "participant-1",
      capabilityKey: "navigator.provider_search_pilot",
      actionType: "transfer_provider_finder_filters",
      payloadJson: { accessNeeds: [], providerFinderPath: "/provider-finder" },
      payloadHash: "abc",
      evidenceRefs: [],
      modelVersion: null,
      promptVersion: null,
      toolVersion: null,
      consentReceiptId: "receipt-1",
      requiredApproverRole: "participant",
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      nonce: "nonce-1",
      status: "approved",
      singleUseConsumed: false,
      decisionReason: null,
      approvedByUserId: "participant-1",
      approvedAt: new Date(),
      executedAt: null,
      executionResultJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValue(
      envelope as never,
    );
    vi.mocked(prisma.consentReceipt.findFirst).mockResolvedValue({
      id: "receipt-1",
      participantId: "participant-1",
      tenantId: "tenant-a",
      purpose: "navigator.provider_search",
      action: "granted",
      permittedActions: ["transfer_provider_finder_filters"],
      permittedFields: [],
      withdrawnAt: null,
      supersededById: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(prisma.governedActionEnvelope.updateMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(prisma.governedActionEnvelope.update).mockResolvedValue({
      ...envelope,
      status: "executed",
      singleUseConsumed: true,
    } as never);

    await executeGovernedActionEnvelope({
      envelopeId: "env-1",
      actorUserId: "participant-1",
      participantId: "participant-1",
      tenantId: "tenant-a",
      nonce: "nonce-1",
      execute: async (payload) => ({ ok: true, payload }),
    });

    await expect(
      executeGovernedActionEnvelope({
        envelopeId: "env-1",
        actorUserId: "participant-1",
        participantId: "participant-1",
        tenantId: "tenant-a",
        nonce: "wrong-nonce",
        execute: async () => ({}),
      }),
    ).rejects.toThrow(/REPLAY|BAD_NONCE/);
  });

  it("creates envelopes only when capability allows the tool", async () => {
    vi.mocked(prisma.governedActionEnvelope.create).mockResolvedValue({
      id: "env-2",
      actionType: "open_human_escalation",
    } as never);

    const created = await createGovernedActionEnvelope({
      tenantId: "tenant-a",
      participantId: "participant-1",
      initiatingUserId: "participant-1",
      capabilityKey: "navigator.provider_search_pilot",
      actionType: "open_human_escalation",
      consentReceiptId: "receipt-1",
      requiredApproverRole: "coordinator",
      payload: {
        reason: "no match",
        urgency: "medium",
        preferredContactMethod: "in_app",
        confidentialityRestrictions: [],
        summary: "Needs human help",
      },
    });

    expect(created.id).toBe("env-2");
  });

  it("rejects model self-approval", async () => {
    vi.mocked(prisma.governedActionEnvelope.findFirst).mockResolvedValue({
      id: "env-3",
      participantId: "participant-1",
      tenantId: "tenant-a",
      status: "proposed",
      expiresAt: new Date(Date.now() + 60_000),
      actionType: "create_care_request_draft",
    } as never);

    await expect(
      approveGovernedActionEnvelope({
        envelopeId: "env-3",
        approverUserId: "ai:navigator",
        participantId: "participant-1",
        tenantId: "tenant-a",
      }),
    ).rejects.toThrow("MODEL_CANNOT_APPROVE");
  });
});
