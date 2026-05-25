import { beforeEach, describe, expect, it, vi } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/lib/auth/current-user";
import {
  assertParticipantOwnsBooking,
  assertWorkerAssignedToShift,
} from "@/lib/care/access-control";

const prismaMock = vi.hoisted(() => ({
  careBooking: {
    findUnique: vi.fn(),
  },
  workerProfile: {
    findUnique: vi.fn(),
  },
  careInvoiceLink: {
    create: vi.fn(),
  },
  careBookingEvent: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

const participantUser: CurrentUser = {
  id: "participant-1",
  email: "participant@example.test",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

describe("Care MVP permissions", () => {
  it("keeps participant, provider, and worker care permissions available", () => {
    expect(hasPermission("participant", "care:manage:self")).toBe(true);
    expect(hasPermission("provider_admin", "care:manage:org")).toBe(true);
    expect(hasPermission("support_worker", "care:shift:work")).toBe(true);
  });

  it("blocks cross-participant booking access", () => {
    expect(() =>
      assertParticipantOwnsBooking(participantUser, {
        participantId: "someone-else",
      })
    ).toThrow("FORBIDDEN");
  });

  it("allows assigned workers to view their shift", () => {
    expect(() =>
      assertWorkerAssignedToShift(
        {
          ...participantUser,
          primaryRole: "support_worker",
          roles: ["support_worker"],
        },
        { workerProfile: { userId: "participant-1" } }
      )
    ).not.toThrow();
  });
});

describe("Care MVP worker eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects high-intensity support tasks", async () => {
    const { hasHighIntensityTask } = await import("@/lib/care/worker-eligibility");
    expect(
      hasHighIntensityTask([{ label: "Complex transfer", intensity: "high" }])
    ).toBe(true);
  });

  it("requires verified screening and high-intensity competency", async () => {
    const { assertWorkerEligibleForBooking } = await import(
      "@/lib/care/worker-eligibility"
    );
    prismaMock.careBooking.findUnique.mockResolvedValue({
      id: "booking-1",
      organisationId: "org-1",
      tasks: [{ label: "High-intensity care", intensity: "high" }],
      accessNeeds: [],
    });
    prismaMock.workerProfile.findUnique.mockResolvedValue({
      id: "worker-1",
      organisationId: "org-1",
      active: true,
      workerScreeningStatus: "verified",
      verificationStatus: "verified",
      highIntensityCompetencyVerified: false,
    });

    await expect(
      assertWorkerEligibleForBooking({
        bookingId: "booking-1",
        workerProfileId: "worker-1",
      })
    ).rejects.toThrow("HIGH_INTENSITY_COMPETENCY_REQUIRED");
  });
});

describe("Care MVP invoice gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks invoice placeholders until a service log is confirmed", async () => {
    const { createInvoicePlaceholderForBooking } = await import(
      "@/lib/care/care-invoice-link-service"
    );
    prismaMock.careBooking.findUnique.mockResolvedValue({
      id: "booking-1",
      participantId: "participant-1",
      organisationId: "org-1",
      serviceLogs: [],
    });

    await expect(
      createInvoicePlaceholderForBooking({
        bookingId: "booking-1",
        actorUserId: "provider-1",
      })
    ).rejects.toThrow("SERVICE_LOG_REQUIRED");
  });
});
import { describe, expect, it, vi, beforeEach } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import {
  assertParticipantOwnsBooking,
  assertWorkerAssignedToShift,
} from "@/lib/care/access-control";
import type { CurrentUser } from "@/lib/auth/current-user";

const prismaMock = vi.hoisted(() => ({
  careBooking: {
    findUnique: vi.fn(),
  },
  workerProfile: {
    findUnique: vi.fn(),
  },
  careInvoiceLink: {
    create: vi.fn(),
    upsert: vi.fn(),
  },
  careBookingEvent: {
    create: vi.fn(),
  },
  auditEvent: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

const participantUser: CurrentUser = {
  id: "participant-1",
  email: "participant@example.test",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

describe("Care MVP permissions", () => {
  it("keeps participant, provider, and worker care permissions available", () => {
    expect(hasPermission("participant", "care:manage:self")).toBe(true);
    expect(hasPermission("provider_admin", "care:manage:org")).toBe(true);
    expect(hasPermission("support_worker", "care:shift:work")).toBe(true);
  });

  it("blocks cross-participant booking access", () => {
    expect(() =>
      assertParticipantOwnsBooking(participantUser, {
        participantId: "someone-else",
      })
    ).toThrow("FORBIDDEN");
  });

  it("allows assigned workers to view their shift", () => {
    expect(() =>
      assertWorkerAssignedToShift(
        { ...participantUser, primaryRole: "support_worker", roles: ["support_worker"] },
        { workerProfile: { userId: "participant-1" } }
      )
    ).not.toThrow();
  });
});

describe("Care MVP worker eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects high-intensity support tasks", async () => {
    const { hasHighIntensityTask } = await import("@/lib/care/worker-eligibility");
    expect(
      hasHighIntensityTask([{ label: "Complex transfer", intensity: "high" }])
    ).toBe(true);
  });

  it("requires verified screening and high-intensity competency", async () => {
    const { assertWorkerEligibleForBooking } = await import(
      "@/lib/care/worker-eligibility"
    );
    prismaMock.careBooking.findUnique.mockResolvedValue({
      id: "booking-1",
      organisationId: "org-1",
      tasks: [{ label: "High-intensity care", intensity: "high" }],
      accessNeeds: [],
    });
    prismaMock.workerProfile.findUnique.mockResolvedValue({
      id: "worker-1",
      organisationId: "org-1",
      active: true,
      workerScreeningStatus: "verified",
      verificationStatus: "verified",
      highIntensityCompetencyVerified: false,
    });

    await expect(
      assertWorkerEligibleForBooking({
        bookingId: "booking-1",
        workerProfileId: "worker-1",
      })
    ).rejects.toThrow("HIGH_INTENSITY_COMPETENCY_REQUIRED");
  });
});

describe("Care MVP invoice gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks invoice placeholders until a service log is confirmed", async () => {
    const { createInvoicePlaceholderForBooking } = await import(
      "@/lib/care/care-invoice-link-service"
    );
    prismaMock.careBooking.findUnique.mockResolvedValue({
      id: "booking-1",
      participantId: "participant-1",
      organisationId: "org-1",
      serviceLogs: [],
    });
    prismaMock.careInvoiceLink.create.mockResolvedValue({ id: "blocked-1" });

    await expect(
      createInvoicePlaceholderForBooking({
        bookingId: "booking-1",
        actorUserId: "provider-1",
      })
    ).rejects.toThrow("SERVICE_LOG_REQUIRED");
  });
});
