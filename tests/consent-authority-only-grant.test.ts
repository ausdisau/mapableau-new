import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  consentCreateMock,
  consentReceiptCreateMock,
  accessReceiptCreateMock,
  auditMock,
} = vi.hoisted(() => ({
  consentCreateMock: vi.fn(),
  consentReceiptCreateMock: vi.fn(),
  accessReceiptCreateMock: vi.fn(),
  auditMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      create: consentCreateMock,
    },
    consentReceipt: {
      create: consentReceiptCreateMock,
    },
    participantAccessReceipt: {
      create: accessReceiptCreateMock,
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: auditMock,
}));

import { grantConsent } from "@/lib/consent/consent-service";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MAPABLE_TRUST_FABRIC_ENABLED = "true";
  consentCreateMock.mockResolvedValue({
    id: "consent-authority-only",
    subjectUserId: "participant-1",
    scope: "support_profile_read",
    purpose: "support_plan:ask_for_support",
    grantedToOrganisationId: null,
    grantedToUserId: null,
    recipientType: "platform",
  });
  consentReceiptCreateMock.mockResolvedValue({ id: "receipt-consent" });
  accessReceiptCreateMock.mockResolvedValue({
    id: "receipt-access",
    correlationId: "corr-1",
  });
  auditMock.mockResolvedValue(undefined);
});

describe("authority-only consent grants", () => {
  it("records consent authority without claiming that disclosure already happened", async () => {
    await grantConsent({
      subjectUserId: "participant-1",
      scope: "support_profile.read",
      purpose: "support_plan:ask_for_support",
      createdById: "participant-1",
      shareMode: "once",
      recipientType: "platform",
      dataScope: ["thingsICanTry", "communicationAccess"],
      sourceAction: "support_plan.share.mapable_human:support-plan-share-123",
      expiryDate: new Date("2026-09-12T06:30:00.000Z"),
      recordDisclosureOnGrant: false,
    });

    expect(consentCreateMock).toHaveBeenCalledTimes(1);
    expect(consentReceiptCreateMock).toHaveBeenCalledTimes(1);
    expect(accessReceiptCreateMock).not.toHaveBeenCalled();
  });

  it("preserves existing disclosure-receipt behaviour by default", async () => {
    await grantConsent({
      subjectUserId: "participant-1",
      scope: "accessibility.read",
      purpose: "existing sharing flow",
      createdById: "participant-1",
      recipientType: "platform",
    });

    expect(accessReceiptCreateMock).toHaveBeenCalledTimes(1);
  });
});
