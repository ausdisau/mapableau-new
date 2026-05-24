import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  SAFETY_COMPLAINT_TYPES,
  createComplaint,
} from "@/lib/complaints/complaint-service";
import {
  canAccessDispute,
  canRespondToDispute,
} from "@/lib/disputes/access";
import { createDispute } from "@/lib/disputes/dispute-service";
import {
  createComplaintSchema,
  createDisputeSchema,
} from "@/lib/validation/disputes";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dispute: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    disputeEvent: { create: vi.fn() },
    complaint: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    complaintEvent: { create: vi.fn() },
    booking: { findUnique: vi.fn() },
    invoice: { findUnique: vi.fn() },
    timesheet: { findUnique: vi.fn() },
    transportBooking: { findUnique: vi.fn() },
    organisationMember: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/notifications/notification-service", () => ({
  notifyUser: vi.fn(),
}));

vi.mock("@/lib/incidents/incident-service", () => ({
  createIncident: vi.fn().mockResolvedValue({ id: "inc-1" }),
  submitIncident: vi.fn().mockResolvedValue({ id: "inc-1" }),
}));

vi.mock("@/lib/config/phase4", () => ({
  phase4Config: {
    disputesWorkflowEnabled: true,
    incidentReportingEnabled: true,
  },
}));

describe("dispute validation", () => {
  it("accepts valid dispute payload", () => {
    const result = createDisputeSchema.safeParse({
      type: "invoice_dispute",
      title: "Wrong charge",
      description: "The invoice amount does not match what was agreed.",
    });
    expect(result.success).toBe(true);
  });
});

describe("createDispute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates dispute for participant", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.dispute.create).mockResolvedValue({
      id: "disp-1",
      participantId: "user-1",
      type: "no_show",
      status: "submitted",
      title: "No show",
    } as never);
    vi.mocked(prisma.disputeEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([]);

    const dispute = await createDispute({
      participantId: "user-1",
      createdById: "user-1",
      type: "no_show",
      title: "No show",
      description: "Worker did not arrive for scheduled support.",
    });

    expect(dispute.id).toBe("disp-1");
    expect(prisma.dispute.create).toHaveBeenCalled();
  });
});

const mockUser = (
  overrides: Partial<import("@/lib/auth/current-user").CurrentUser> &
    Pick<import("@/lib/auth/current-user").CurrentUser, "id" | "primaryRole">
): import("@/lib/auth/current-user").CurrentUser => ({
  email: "test@example.com",
  name: "Test User",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  roles: [overrides.primaryRole],
  ...overrides,
});

describe("dispute access control", () => {
  it("allows participant to access own dispute", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([]);

    const allowed = await canAccessDispute(
      mockUser({ id: "user-1", primaryRole: "participant" }),
      {
        participantId: "user-1",
        organisationId: null,
        createdById: "user-1",
      }
    );
    expect(allowed).toBe(true);
  });

  it("blocks unrelated user", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([]);

    const allowed = await canAccessDispute(
      mockUser({ id: "user-2", primaryRole: "participant" }),
      {
        participantId: "user-1",
        organisationId: "org-1",
        createdById: "user-1",
      }
    );
    expect(allowed).toBe(false);
  });

  it("allows provider org member to respond when status permits", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([
      { organisationId: "org-1" },
    ] as never);

    const allowed = await canRespondToDispute(
      mockUser({ id: "prov-1", primaryRole: "provider_admin" }),
      { organisationId: "org-1", status: "awaiting_provider_response" }
    );
    expect(allowed).toBe(true);
  });
});

describe("safety complaint escalation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks unsafe_service as safety type", () => {
    expect(SAFETY_COMPLAINT_TYPES).toContain("unsafe_service");
  });

  it("escalates safety complaint to incident", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { createIncident, submitIncident } = await import(
      "@/lib/incidents/incident-service"
    );

    vi.mocked(prisma.complaint.create).mockResolvedValue({
      id: "comp-1",
      participantId: "user-1",
      type: "unsafe_service",
      status: "submitted",
      title: "Unsafe",
    } as never);
    vi.mocked(prisma.complaintEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.complaint.update).mockResolvedValue({} as never);
    vi.mocked(prisma.complaint.findUnique).mockResolvedValue({
      id: "comp-1",
      events: [],
    } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);

    await createComplaint({
      participantId: "user-1",
      createdById: "user-1",
      type: "unsafe_service",
      title: "Unsafe visit",
      description: "I did not feel safe during the support session.",
    });

    expect(createIncident).toHaveBeenCalled();
    expect(submitIncident).toHaveBeenCalledWith("inc-1", "user-1");
    expect(prisma.complaint.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "escalated_to_incident",
          safetyEscalated: true,
        }),
      })
    );
  });
});

describe("complaint validation", () => {
  it("rejects short description", () => {
    const result = createComplaintSchema.safeParse({
      type: "other",
      title: "Test",
      description: "short",
    });
    expect(result.success).toBe(false);
  });
});
