import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  accessDeniedMessage,
  canAccessFamilyPortal,
  canAccessPlanManagerPortal,
  canAccessSupportCoordinatorPortal,
} from "@/lib/access/role-policy";
import { scopeLabel, ALL_NOMINEE_SCOPES } from "@/lib/family/family-permission-policy";
import { FUNDING_DISCLAIMER } from "@/lib/home-modifications/home-modification-service";
import { createReferralSchema } from "@/lib/validation/support-coordination";
import { homeModificationRequestSchema } from "@/lib/validation/home-modifications";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    supportCoordinatorRelationship: { findUnique: vi.fn() },
    planManagerRelationship: { findUnique: vi.fn() },
    participantNomineeLink: { findFirst: vi.fn(), findUnique: vi.fn() },
    supportCoordinationReferral: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    referralEvent: { create: vi.fn() },
    dataAccessLog: { create: vi.fn() },
    auditEvent: { create: vi.fn() },
    notification: { create: vi.fn() },
    notificationEvent: { create: vi.fn() },
    notificationPreference: { findFirst: vi.fn() },
    homeModificationRequest: { create: vi.fn() },
    homeModificationDocument: { create: vi.fn() },
    invoice: { findUnique: vi.fn(), findMany: vi.fn() },
    paymentProcessingRecord: { create: vi.fn() },
    planManagerInvoiceInbox: { update: vi.fn() },
    invoiceReviewEvent: { create: vi.fn() },
    planManagerInvoiceReview: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    booking: { create: vi.fn() },
    nomineeActionLog: { create: vi.fn() },
    supportedDecisionRecord: { create: vi.fn() },
    nomineePermission: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/notifications/notification-service", () => ({
  notifyUser: vi.fn(),
}));

vi.mock("@/lib/access/notification-event-service", () => ({
  createNotificationEvent: vi.fn(),
}));

describe("shared access control", () => {
  it("denies unauthorised role for coordinator portal", () => {
    expect(canAccessSupportCoordinatorPortal("participant")).toBe(false);
    expect(canAccessSupportCoordinatorPortal("support_coordinator")).toBe(true);
  });

  it("allows plan manager portal permission", () => {
    expect(canAccessPlanManagerPortal("plan_manager")).toBe(true);
    expect(canAccessPlanManagerPortal("participant")).toBe(false);
  });

  it("allows family portal for family_member and participant", () => {
    expect(canAccessFamilyPortal("family_member")).toBe(true);
    expect(canAccessFamilyPortal("participant")).toBe(true);
    expect(canAccessFamilyPortal("driver")).toBe(false);
  });

  it("returns plain-language access denied messages", () => {
    expect(accessDeniedMessage("no_consent")).toContain("consent");
    expect(accessDeniedMessage("scope_missing")).toContain("permission");
  });
});

describe("consent checks", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.supportCoordinatorRelationship.findUnique).mockResolvedValue(null);
  });

  it("support coordinator cannot access participant without consent", async () => {
    const { checkCoordinatorParticipantAccess } = await import(
      "@/lib/access/consent-aware-access"
    );
    const result = await checkCoordinatorParticipantAccess({
      coordinatorId: "coord-1",
      participantId: "part-1",
      actorRole: "support_coordinator",
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("no_consent");
    }
  });

  it("support coordinator can access with active relationship", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.supportCoordinatorRelationship.findUnique).mockResolvedValue({
      id: "rel-1",
      participantId: "part-1",
      coordinatorId: "coord-1",
      status: "active",
      consentRecordId: null,
      scopesJson: [],
      createdAt: new Date(),
    });

    const { checkCoordinatorParticipantAccess } = await import(
      "@/lib/access/consent-aware-access"
    );
    const result = await checkCoordinatorParticipantAccess({
      coordinatorId: "coord-1",
      participantId: "part-1",
      actorRole: "support_coordinator",
    });
    expect(result.allowed).toBe(true);
  });
});

describe("support coordination", () => {
  it("validates referral creation schema", () => {
    const result = createReferralSchema.safeParse({
      participantId: "p1",
      title: "Physio referral",
    });
    expect(result.success).toBe(true);
  });

  it("requires participant approval before referral becomes booking", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.supportCoordinationReferral.findUnique).mockResolvedValue({
      id: "ref-1",
      participantId: "part-1",
      coordinatorId: "coord-1",
      providerId: null,
      organisationId: null,
      title: "Test",
      description: null,
      status: "draft",
      participantApprovedAt: null,
      bookingId: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { updateReferralStatus } = await import(
      "@/lib/support-coordination/referral-service"
    );

    await expect(
      updateReferralStatus({
        referralId: "ref-1",
        actorUserId: "coord-1",
        actorRole: "support_coordinator",
        status: "converted_to_booking",
      })
    ).rejects.toThrow("PARTICIPANT_APPROVAL_REQUIRED");
  });
});

describe("plan manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("plan manager cannot see unlinked participant invoice", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.planManagerRelationship.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: "inv-1",
      participantId: "part-1",
    } as never);

    const { assertPlanManagerInvoiceAccess } = await import(
      "@/lib/plan-manager/plan-manager-access-policy"
    );

    await expect(
      assertPlanManagerInvoiceAccess("pm-1", "inv-1")
    ).rejects.toThrow("CONSENT_REQUIRED");
  });

  it("payment status update creates audit log", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { createAuditEvent } = await import("@/lib/audit/audit-event-service");

    vi.mocked(prisma.planManagerRelationship.findUnique).mockResolvedValue({
      id: "rel",
      participantId: "part-1",
      planManagerId: "pm-1",
      status: "active",
      consentRecordId: null,
      createdAt: new Date(),
    });
    vi.mocked(prisma.invoice.findUnique).mockResolvedValue({
      id: "inv-1",
      participantId: "part-1",
    } as never);
    vi.mocked(prisma.paymentProcessingRecord.create).mockResolvedValue({
      id: "pay-1",
      status: "paid",
    } as never);
    vi.mocked(prisma.planManagerInvoiceInbox.update).mockResolvedValue({} as never);

    const { markInvoicePaid } = await import(
      "@/lib/plan-manager/payment-status-service"
    );

    await markInvoicePaid({
      invoiceId: "inv-1",
      planManagerId: "pm-1",
      actorUserId: "pm-1",
    });

    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "plan_manager.payment_paid",
        entityType: "Invoice",
      })
    );
  });
});

describe("family / nominee", () => {
  it("defines all permission scopes with labels", () => {
    expect(ALL_NOMINEE_SCOPES).toContain("view_documents");
    expect(ALL_NOMINEE_SCOPES).toContain("create_booking_draft");
    expect(scopeLabel("approve_invoice")).toBe("Approve invoices");
  });

  it("family user cannot view documents without permission scope", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.participantNomineeLink.findUnique).mockResolvedValue({
      id: "link-1",
      participantId: "part-1",
      nomineeId: "nom-1",
      status: "active",
      invitedById: "part-1",
      acceptedAt: new Date(),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [],
    } as never);

    const { hasNomineeScope } = await import("@/lib/family/family-permission-policy");
    const canViewDocs = await hasNomineeScope({
      nomineeId: "nom-1",
      participantId: "part-1",
      scope: "view_documents",
    });
    expect(canViewDocs).toBe(false);
  });
});

describe("home modifications", () => {
  it("validates home modification request schema", () => {
    const result = homeModificationRequestSchema.safeParse({
      title: "Ramp installation",
    });
    expect(result.success).toBe(true);
  });

  it("funding disclaimer does not claim approval", () => {
    expect(FUNDING_DISCLAIMER.toLowerCase()).toContain("does not guarantee");
    expect(FUNDING_DISCLAIMER.toLowerCase()).not.toContain("approved");
  });
});

describe("nominee permission scopes", () => {
  it("includes required scopes from spec", () => {
    const required = [
      "view_dashboard",
      "view_bookings",
      "create_booking_draft",
      "approve_invoice",
      "view_documents",
      "view_emergency_profile",
    ];
    for (const scope of required) {
      expect(ALL_NOMINEE_SCOPES).toContain(scope);
    }
  });
});
