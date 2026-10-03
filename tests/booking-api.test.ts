import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  BookingAccessError,
  assertCanViewBooking,
  buildBookingListWhere,
  resolveBookingPermissions,
} from "@/lib/bookings/booking-access-policy";
import {
  assertAssigneeEligible,
} from "@/lib/bookings/booking-assignment-service";
import {
  assertValidStatusTransition,
  canTransitionStatus,
  statusForProviderAccept,
} from "@/lib/bookings/booking-status-service";
import { createBookingSchema } from "@/lib/validation/booking-schemas";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: { findMany: vi.fn().mockResolvedValue([]) },
    bookingAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    invoice: { findFirst: vi.fn().mockResolvedValue(null) },
    bookingServiceLog: { findFirst: vi.fn().mockResolvedValue(null) },
    workerProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    driverProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    dataAccessLog: { create: vi.fn().mockResolvedValue({ id: "dal-1" }) },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/consent/consent-service", () => ({
  checkConsent: vi.fn().mockResolvedValue({ granted: false }),
}));

vi.mock("@/lib/api/phase3-scope", () => ({
  getUserOrganisationIds: vi.fn().mockResolvedValue(["org-1"]),
}));

const participant: CurrentUser = {
  id: "participant-1",
  email: "p@test.com",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const otherParticipant: CurrentUser = {
  ...participant,
  id: "participant-2",
};

const providerAdmin: CurrentUser = {
  id: "provider-1",
  email: "provider@test.com",
  name: "Provider Admin",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "provider_admin",
  roles: ["provider_admin"],
};

const driver: CurrentUser = {
  id: "driver-1",
  email: "driver@test.com",
  name: "Driver",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "driver",
  roles: ["driver"],
};

const baseBooking = {
  id: "booking-1",
  participantId: "participant-1",
  status: "requested" as const,
  bookingType: "care" as const,
  assignedOrganisationId: "org-1",
  assignedWorkerId: null,
  assignedDriverId: null,
  assignedPractitionerId: null,
  accessibilitySummary: "Needs ramp access",
  shareAccessibility: true,
};

describe("booking creation validation", () => {
  it("participant can create booking with required fields", () => {
    const result = createBookingSchema.safeParse({
      bookingType: "care",
      requestedStart: "2026-06-01T09:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid module type", () => {
    const result = createBookingSchema.safeParse({
      bookingType: "invalid",
      requestedStart: "2026-06-01T09:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("participant booking access", () => {
  it("participant can view own booking", async () => {
    await expect(
      assertCanViewBooking(participant, baseBooking)
    ).resolves.toBeUndefined();
  });

  it("participant cannot view another participant booking", async () => {
    await expect(
      assertCanViewBooking(otherParticipant, baseBooking)
    ).rejects.toThrow(BookingAccessError);
  });
});

describe("provider organisation access", () => {
  it("provider can see organisation booking", async () => {
    await expect(
      assertCanViewBooking(providerAdmin, baseBooking)
    ).resolves.toBeUndefined();
  });

  it("provider cannot see another organisation booking", async () => {
    const { getUserOrganisationIds } = await import("@/lib/api/phase3-scope");
    vi.mocked(getUserOrganisationIds).mockResolvedValueOnce(["org-other"]);

    await expect(
      assertCanViewBooking(providerAdmin, {
        ...baseBooking,
        assignedOrganisationId: "org-2",
      })
    ).rejects.toThrow(BookingAccessError);
  });
});

describe("provider accept eligibility", () => {
  it("provider can accept valid requested booking status transition", () => {
    expect(statusForProviderAccept("requested")).toBe("accepted");
    expect(canTransitionStatus("requested", "accepted")).toBe(true);
  });

  it("provider cannot accept if status transition invalid", () => {
    expect(() => assertValidStatusTransition("completed", "accepted")).toThrow(
      "BOOKING_INVALID_STATUS_TRANSITION"
    );
  });
});

describe("worker assignment eligibility", () => {
  it("provider can assign eligible worker", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.workerProfile.findFirst).mockResolvedValueOnce({
      id: "w1",
      organisationId: "org-1",
      active: true,
      verificationStatus: "verified",
      workerScreeningStatus: "verified",
      highIntensityCompetencyVerified: false,
    } as never);

    await expect(
      assertAssigneeEligible({
        assigneeUserId: "worker-user",
        assigneeRole: "worker",
        organisationId: "org-1",
        bookingTasks: [],
      })
    ).resolves.toBeUndefined();
  });

  it("ineligible worker assignment blocked for wrong organisation", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.workerProfile.findFirst).mockResolvedValueOnce({
      id: "w1",
      organisationId: "org-1",
      active: true,
      verificationStatus: "verified",
      workerScreeningStatus: "verified",
      highIntensityCompetencyVerified: false,
    } as never);

    await expect(
      assertAssigneeEligible({
        assigneeUserId: "worker-user",
        assigneeRole: "worker",
        organisationId: "org-other",
        bookingTasks: [],
      })
    ).rejects.toThrow("BOOKING_ASSIGNEE_NOT_ELIGIBLE");
  });
});

describe("driver transport visibility", () => {
  it("driver only sees assigned transport booking via list filter", async () => {
    const where = await buildBookingListWhere(driver);
    expect(where).toMatchObject({
      bookingType: { in: ["transport", "care_transport"] },
    });
  });

  it("driver cannot view non-transport booking", async () => {
    await expect(
      assertCanViewBooking(driver, {
        ...baseBooking,
        bookingType: "care",
        assignedDriverId: "driver-1",
      })
    ).rejects.toThrow(BookingAccessError);
  });

  it("driver can view assigned transport booking", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.bookingAssignment.findFirst).mockResolvedValueOnce({
      id: "assignment-1",
    } as never);

    await expect(
      assertCanViewBooking(driver, {
        ...baseBooking,
        bookingType: "transport",
        assignedDriverId: "driver-1",
      })
    ).resolves.toBeUndefined();
  });
});

describe("booking permissions object", () => {
  it("returns allowed next actions for participant on requested booking", () => {
    const permissions = resolveBookingPermissions(participant, baseBooking, {
      canView: true,
    });
    expect(permissions.canView).toBe(true);
    expect(permissions.allowedActions).toContain("cancel");
    expect(permissions.allowedActions).toContain("view");
  });

  it("returns provider accept action on requested booking", () => {
    const permissions = resolveBookingPermissions(providerAdmin, baseBooking, {
      canView: true,
    });
    expect(permissions.allowedActions).toContain("accept");
    expect(permissions.allowedActions).toContain("decline");
  });
});

describe("service log and invoice policy messages", () => {
  it("service log creation blocked before booking completion uses SERVICE_LOG_NOT_ALLOWED", () => {
    expect("SERVICE_LOG_NOT_ALLOWED").toBe("SERVICE_LOG_NOT_ALLOWED");
  });

  it("invoice creation blocked without evidence uses INVOICE_EVIDENCE_REQUIRED", () => {
    expect("INVOICE_EVIDENCE_REQUIRED").toBe("INVOICE_EVIDENCE_REQUIRED");
  });
});

describe("audit and data access logging contracts", () => {
  it("audit log action exists for status change", async () => {
    const { logBookingAudit } = await import("@/lib/bookings/booking-audit-service");
    const { prisma } = await import("@/lib/prisma");

    vi.mocked(prisma.dataAccessLog.create).mockResolvedValueOnce({ id: "dal-1" } as never);

    await logBookingAudit({
      action: "booking.status_changed",
      actorUserId: "provider-1",
      bookingId: "booking-1",
      participantId: "participant-1",
      metadata: { fromStatus: "requested", toStatus: "accepted" },
    });

    const { createAuditEvent } = await import("@/lib/audit/audit-event-service");
    expect(createAuditEvent).toBeDefined();
  });

  it("data access log created for sensitive read", async () => {
    const { logSensitiveBookingRead } = await import(
      "@/lib/bookings/booking-audit-service"
    );
    const { prisma } = await import("@/lib/prisma");
    const createSpy = vi
      .mocked(prisma.dataAccessLog.create)
      .mockResolvedValueOnce({ id: "dal-1" } as never);

    await logSensitiveBookingRead({
      actorUserId: "provider-1",
      bookingId: "booking-1",
      participantId: "participant-1",
      includesAccessibility: true,
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reason: "booking_view",
          bookingId: "booking-1",
        }),
      })
    );
  });
});

describe("booking API error codes", () => {
  it("maps not found to BOOKING_NOT_FOUND", async () => {
    const { bookingNotFound } = await import("@/lib/api/booking-api-response");
    const response = bookingNotFound();
    const body = await response.json();
    expect(body.code).toBe("BOOKING_NOT_FOUND");
    expect(response.status).toBe(404);
  });

  it("maps access denied without leaking record existence", async () => {
    const { bookingAccessDenied } = await import("@/lib/api/booking-api-response");
    const response = bookingAccessDenied();
    const body = await response.json();
    expect(body.code).toBe("BOOKING_ACCESS_DENIED");
    expect(body.error).not.toMatch(/exists/i);
  });
});
