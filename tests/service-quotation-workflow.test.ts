import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    careRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    serviceQuotation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    serviceRequestApproval: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));
vi.mock("@/lib/notifications/notification-service", () => ({
  notifyUser: vi.fn(async () => undefined),
}));

import {
  createQuotationDraftFromRequest,
  evaluateApprovalGate,
} from "@/lib/care/service-quotation-service";

describe("service quotation workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets request to awaiting_admin_review when gate not approved", async () => {
    mockPrisma.careRequest.findUnique.mockResolvedValue({
      id: "req-1",
      fundingSource: { type: "ndis_plan_managed" },
      serviceRequestApprovals: [],
      serviceQuotations: [],
    });

    await evaluateApprovalGate("req-1");

    expect(mockPrisma.careRequest.update).toHaveBeenCalledWith({
      where: { id: "req-1" },
      data: { status: "awaiting_admin_review" },
    });
  });

  it("creates ready_for_review quotation when approved", async () => {
    mockPrisma.careRequest.findUnique.mockResolvedValue({
      id: "req-2",
      participantId: "participant-1",
      assignedOrganisationId: null,
      tasks: [{ name: "Personal care" }],
      fundingSource: { type: "ndis_plan_managed" },
      serviceRequestApprovals: [{ actorRole: "plan_manager", decision: "approved" }],
    });
    mockPrisma.serviceQuotation.findFirst.mockResolvedValue(null);
    mockPrisma.serviceQuotation.create.mockResolvedValue({
      id: "quote-1",
      status: "ready_for_review",
    });

    const result = await createQuotationDraftFromRequest({
      careRequestId: "req-2",
      actorUserId: "admin-1",
    });

    expect(mockPrisma.serviceQuotation.create).toHaveBeenCalled();
    expect(result.status).toBe("ready_for_review");
  });
});
