import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    navigatorEscalationCase: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import {
  createNavigatorEscalation,
  getNavigatorEscalation,
  listNavigatorEscalationsForTenant,
} from "@/lib/navigator/pilot/escalation";

describe("Navigator escalation IDOR / tenancy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks cross-tenant list access", async () => {
    await expect(
      listNavigatorEscalationsForTenant({
        tenantId: "tenant-a",
        actorUserId: "reviewer-1",
        actorTenantId: "tenant-b",
      }),
    ).rejects.toThrow("CROSS_TENANT_DENIED");
  });

  it("blocks cross-participant detail access", async () => {
    vi.mocked(prisma.navigatorEscalationCase.findFirst).mockResolvedValue({
      id: "esc-1",
      tenantId: "tenant-a",
      participantId: "participant-1",
      reason: "participant_requested_person",
      urgency: "low",
      preferredContactMethod: "in_app",
      confidentialityRestrictions: [],
      requiredReviewerRole: "coordinator",
      summary: "help",
      conflictCheckJson: {},
      assignmentHistoryJson: [],
      responseDeadlineAt: new Date(),
      participantVisibleStatus: "awaiting_human_review",
      status: "open",
      evidenceRefs: [],
      passportId: null,
      envelopeId: null,
      resolutionSummary: null,
      createdByUserId: "participant-1",
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    await expect(
      getNavigatorEscalation({
        id: "esc-1",
        tenantId: "tenant-a",
        actorUserId: "participant-2",
        actorTenantId: "tenant-a",
        actorParticipantId: "participant-2",
        isReviewer: false,
      }),
    ).rejects.toThrow("CROSS_PARTICIPANT_DENIED");
  });

  it("creates escalation when conflict check passes", async () => {
    vi.mocked(prisma.navigatorEscalationCase.create).mockResolvedValue({
      id: "esc-2",
      tenantId: "tenant-a",
      participantId: "participant-1",
    } as never);

    const row = await createNavigatorEscalation({
      tenantId: "tenant-a",
      participantId: "participant-1",
      actorUserId: "participant-1",
      reason: "hard_constraints_no_safe_match",
      urgency: "medium",
      preferredContactMethod: "in_app",
      confidentialityRestrictions: [],
      requiredReviewerRole: "coordinator",
      summary: "No safe match",
      conflictOfInterestCheckPassed: true,
      responseDeadlineAt: new Date(Date.now() + 3600_000).toISOString(),
      evidenceRefs: [],
    });

    expect(row.id).toBe("esc-2");
    expect(prisma.navigatorEscalationCase.create).toHaveBeenCalled();
  });
});
