import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentReceipt: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import {
  issuePurposeConsentReceipt,
  verifyPurposeConsent,
  withdrawPurposeConsentReceipt,
} from "@/lib/consent/purpose-consent";

describe("Purpose consent receipts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies current purpose consent", async () => {
    vi.mocked(prisma.consentReceipt.findFirst).mockResolvedValue({
      id: "r1",
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "granted",
      permittedActions: ["provider_search"],
      permittedFields: ["preferences", "access_needs", "location"],
      withdrawnAt: null,
      supersededById: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    const result = await verifyPurposeConsent({
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "provider_search",
      fields: ["preferences"],
    });
    expect(result.ok).toBe(true);
    expect(result.receiptId).toBe("r1");
  });

  it("fails closed for expired consent", async () => {
    vi.mocked(prisma.consentReceipt.findFirst).mockResolvedValue({
      id: "r2",
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "granted",
      permittedActions: ["provider_search"],
      permittedFields: [],
      withdrawnAt: null,
      supersededById: null,
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    const result = await verifyPurposeConsent({
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "provider_search",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("expired");
  });

  it("fails closed for withdrawn consent", async () => {
    vi.mocked(prisma.consentReceipt.findFirst).mockResolvedValue({
      id: "r3",
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "granted",
      permittedActions: ["provider_search"],
      permittedFields: [],
      withdrawnAt: new Date(),
      supersededById: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    const result = await verifyPurposeConsent({
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "provider_search",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("withdrawn");
  });

  it("fails closed for superseded consent", async () => {
    vi.mocked(prisma.consentReceipt.findFirst).mockResolvedValue({
      id: "r4",
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "granted",
      permittedActions: ["provider_search"],
      permittedFields: [],
      withdrawnAt: null,
      supersededById: "r5",
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    const result = await verifyPurposeConsent({
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "provider_search",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("superseded");
  });

  it("fails closed for insufficient action scope", async () => {
    vi.mocked(prisma.consentReceipt.findFirst).mockResolvedValue({
      id: "r6",
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "granted",
      permittedActions: ["read_only"],
      permittedFields: [],
      withdrawnAt: null,
      supersededById: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    const result = await verifyPurposeConsent({
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      action: "create_care_request_draft",
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("action_not_permitted");
  });

  it("issues and withdraws purpose receipts", async () => {
    vi.mocked(prisma.consentReceipt.create).mockResolvedValue({
      id: "r7",
      participantId: "p1",
    } as never);
    vi.mocked(prisma.consentReceipt.findFirst).mockResolvedValue({
      id: "r7",
      participantId: "p1",
      withdrawnAt: null,
    } as never);
    vi.mocked(prisma.consentReceipt.update).mockResolvedValue({
      id: "r7",
      withdrawnAt: new Date(),
      action: "revoked",
    } as never);

    await issuePurposeConsentReceipt({
      participantId: "p1",
      tenantId: "t1",
      purpose: "navigator.provider_search",
      scope: "navigator.provider_search",
      permittedFields: ["preferences"],
      permittedActions: ["provider_search"],
      issuingActorUserId: "p1",
      supporterInvolved: false,
      accessibleFormat: "easy_read",
      policyVersion: "v1",
      consentTextVersion: "v1",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await withdrawPurposeConsentReceipt({
      receiptId: "r7",
      participantId: "p1",
      actorUserId: "p1",
    });

    expect(prisma.consentReceipt.update).toHaveBeenCalled();
  });
});
