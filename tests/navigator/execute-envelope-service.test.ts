import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/navigator-pilot", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/config/navigator-pilot")>();
  return {
    ...actual,
    assertNavigatorPilotEnabled: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    governedActionEnvelope: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    consentReceipt: {
      findFirst: vi.fn(),
    },
    participantAuthorityGrant: {
      findFirst: vi.fn(),
    },
    careRequest: {
      create: vi.fn(),
    },
    navigatorEscalationCase: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/care/care-request-service", () => ({
  createCareRequest: vi.fn(),
}));

import { createCareRequest } from "@/lib/care/care-request-service";
import { executeNavigatorEnvelope } from "@/lib/navigator/pilot/execute-envelope";
import { prisma } from "@/lib/prisma";

describe("executeNavigatorEnvelope service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT = "true";
  });

  function mockApprovedEnvelope(overrides: Record<string, unknown> = {}) {
    const envelope = {
      id: "env-1",
      tenantId: "tenant-a",
      participantId: "participant-1",
      initiatingUserId: "participant-1",
      capabilityKey: "navigator.provider_search_pilot",
      actionType: "create_care_request_draft",
      payloadJson: {
        requestType: "personal_care",
        title: "Draft support request",
        description: "Need weekday personal care",
        state: "NSW",
      },
      payloadHash: "hash",
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
      decisionReason: "participant_approved",
      approvedByUserId: "participant-1",
      approvedAt: new Date(),
      executedAt: null,
      executionResultJson: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
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
      permittedActions: [
        "create_care_request_draft",
        "transfer_provider_finder_filters",
        "open_human_escalation",
      ],
      permittedFields: [],
      withdrawnAt: null,
      supersededById: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(prisma.governedActionEnvelope.updateMany).mockResolvedValue({
      count: 1,
    } as never);
    return envelope;
  }

  it("creates a CareRequest draft on execute", async () => {
    mockApprovedEnvelope();
    vi.mocked(createCareRequest).mockResolvedValue({
      id: "cr-99",
      status: "draft",
    } as never);
    vi.mocked(prisma.governedActionEnvelope.update).mockImplementation(
      ((args: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: "env-1",
          status: args.data.status,
          executionResultJson: args.data.executionResultJson,
          singleUseConsumed: true,
        })) as never,
    );

    const outcome = await executeNavigatorEnvelope({
      envelopeId: "env-1",
      actorUserId: "participant-1",
      participantId: "participant-1",
      tenantId: "tenant-a",
      nonce: "nonce-1",
    });

    expect(createCareRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        participantId: "participant-1",
        createdById: "participant-1",
        title: "Draft support request",
        requestType: "personal_care",
      }),
    );
    expect(outcome.result).toEqual(
      expect.objectContaining({
        kind: "care_request_draft",
        careRequestId: "cr-99",
        status: "draft",
      }),
    );
  });

  it("returns Provider Finder URL transfer without creating a booking", async () => {
    mockApprovedEnvelope({
      actionType: "transfer_provider_finder_filters",
      payloadJson: {
        q: "personal care",
        state: "nsw",
        postcode: "2300",
        accessNeeds: ["wheelchair"],
        providerFinderPath: "/provider-finder",
      },
    });
    vi.mocked(prisma.governedActionEnvelope.update).mockImplementation(
      ((args: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: "env-1",
          status: args.data.status,
          executionResultJson: args.data.executionResultJson,
        })) as never,
    );

    const outcome = await executeNavigatorEnvelope({
      envelopeId: "env-1",
      actorUserId: "participant-1",
      participantId: "participant-1",
      tenantId: "tenant-a",
      nonce: "nonce-1",
    });

    expect(createCareRequest).not.toHaveBeenCalled();
    expect(outcome.result).toEqual({
      kind: "provider_finder_transfer",
      providerFinderUrl:
        "/provider-finder?q=personal+care&state=NSW&postcode=2300&accessNeeds=wheelchair",
    });
  });
});
