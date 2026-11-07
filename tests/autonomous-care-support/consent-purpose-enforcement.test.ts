import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authority/participant-authority-service", () => ({
  hasParticipantAuthority: vi.fn(),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async () => ({ id: "receipt-1" })),
}));

vi.mock("@/lib/passport", () => ({
  fieldCategoriesForConsentScope: () => [],
  filterFieldCategoriesForRecipient: (x: unknown) => x,
  invalidatePassportProjectionCache: vi.fn(),
}));

vi.mock("@/lib/trust/fabric/receipt-service", () => ({
  recordDisclosureReceipt: vi.fn(),
}));

import { checkConsent } from "@/lib/consent/consent-service";
import { verifyPurposeConsent } from "@/lib/consent/purpose-consent";
import { prisma } from "@/lib/prisma";

describe("ACS Stage 1 — purpose consent enforcement (N3–N5, P4)", () => {
  beforeEach(() => {
    vi.mocked(prisma.consentRecord.findMany).mockReset();
  });

  it("N4: purpose mismatch denied", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c1",
        purpose: "care.roster.lookup",
        status: "active",
        expiryDate: null,
        dataScope: ["workerName"],
        sourceAction: "read",
        createdAt: new Date(),
      } as never,
    ]);
    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p-a",
      actorUserId: "p-a",
      scope: "profile.read",
      purpose: "care.family.notify",
      action: "notify",
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "purpose_mismatch" });
  });

  it("N5: dataScope over-read denied", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c1",
        purpose: "care.roster.lookup",
        status: "active",
        expiryDate: null,
        dataScope: ["workerName", "shiftStart"],
        sourceAction: "read",
        createdAt: new Date(),
      } as never,
    ]);
    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p-a",
      actorUserId: "p-a",
      scope: "profile.read",
      purpose: "care.roster.lookup",
      action: "read",
      permittedFields: ["address"],
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "fields_insufficient" });
  });

  it("N3: revoked consent denied on next check", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c1",
        purpose: "care.roster.lookup",
        status: "revoked",
        expiryDate: null,
        dataScope: ["workerName"],
        sourceAction: "read",
        createdAt: new Date(),
      } as never,
    ]);
    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p-a",
      actorUserId: "p-a",
      scope: "profile.read",
      purpose: "care.roster.lookup",
      action: "read",
      silent: true,
    });
    expect(result).toEqual({ ok: false, reason: "consent_withdrawn" });
  });

  it("P4: exact-purpose roster lookup allowed with minimum fields", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c-ok",
        purpose: "care.roster.lookup",
        status: "active",
        expiryDate: new Date(Date.now() + 60_000),
        dataScope: ["workerName", "shiftStart"],
        sourceAction: "read,*",
        createdAt: new Date(),
      } as never,
    ]);
    const result = await verifyPurposeConsent({
      tenantId: "t1",
      participantId: "p-a",
      actorUserId: "p-a",
      scope: "profile.read",
      purpose: "care.roster.lookup",
      action: "read",
      permittedFields: ["workerName"],
      silent: true,
    });
    expect(result.ok).toBe(true);
  });

  it("checkConsent enforces purpose when provided", async () => {
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "c1",
        purpose: "care.roster.lookup",
        status: "active",
        expiryDate: null,
        dataScope: ["workerName"],
        sourceAction: "read",
        createdAt: new Date(),
      } as never,
    ]);
    await expect(
      checkConsent({
        subjectUserId: "p-a",
        scope: "profile.read",
        purpose: "care.family.notify",
      }),
    ).resolves.toBe(false);
    await expect(
      checkConsent({
        subjectUserId: "p-a",
        scope: "profile.read",
        purpose: "care.roster.lookup",
        permittedFields: ["workerName"],
        sourceAction: "read",
      }),
    ).resolves.toBe(true);
  });
});
