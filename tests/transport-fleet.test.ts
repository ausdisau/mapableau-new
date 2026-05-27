import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";

const providerUser: CurrentUser = {
  id: "provider-admin-1",
  email: "prov@test.com",
  name: "Provider",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "transport_operator",
  roles: ["transport_operator"],
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportVehicle: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    transportVehicleFeature: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    transportVehicleVerification: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    transportDriver: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    transportDriverVerification: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    transportDispatchAssignment: { findFirst: vi.fn() },
    vehicle: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { createFleetVehicle } from "@/lib/transport/transport-fleet-vehicle-service";
import { updateFleetVehicle } from "@/lib/transport/transport-fleet-vehicle-service";
import {
  checkVerificationRecords,
  FLEET_VEHICLE_VERIFICATION_KINDS,
} from "@/lib/transport/transport-fleet-verification";

describe("transport-fleet-verification", () => {
  it("flags missing verified registration", () => {
    const reasons = checkVerificationRecords(
      [{ kind: "registration", status: "pending_review", expiresAt: null }],
      FLEET_VEHICLE_VERIFICATION_KINDS
    );
    expect(reasons.some((r) => r.includes("registration"))).toBe(true);
  });

  it("passes when all required kinds verified", () => {
    const now = new Date();
    const records = FLEET_VEHICLE_VERIFICATION_KINDS.map((kind) => ({
      kind,
      status: "verified",
      expiresAt: new Date(now.getTime() + 86400000),
    }));
    expect(checkVerificationRecords(records, FLEET_VEHICLE_VERIFICATION_KINDS)).toEqual(
      []
    );
  });
});

describe("createFleetVehicle", () => {
  beforeEach(() => {
    vi.mocked(prisma.transportVehicle.create).mockResolvedValue({
      id: "tv-new",
      organisationId: "org-1",
      displayName: "Van 1",
      registrationNumber: "ABC123",
      vehicleId: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      features: [
        {
          id: "f1",
          vehicleId: "tv-new",
          wheelchairAccessible: true,
          rampAvailable: false,
          liftAvailable: false,
          hoistAvailable: false,
          assistanceAnimalFriendly: true,
          metadata: null,
        },
      ],
      verifications: [],
    } as never);
    vi.mocked(prisma.transportVehicle.findUnique).mockResolvedValue({
      id: "tv-new",
      organisationId: "org-1",
      displayName: "Van 1",
      registrationNumber: "ABC123",
      vehicleId: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      features: [],
      verifications: [
        { id: "v1", kind: "registration", status: "pending_review", expiresAt: null, notes: null },
      ],
    } as never);
    vi.mocked(prisma.transportVehicleVerification.createMany).mockResolvedValue({
      count: 3,
    });
  });

  it("creates vehicle with features and seeds verifications", async () => {
    const result = await createFleetVehicle(providerUser, "org-1", {
      displayName: "Van 1",
      registrationNumber: "ABC123",
      features: { wheelchairAccessible: true },
    });
    expect(result.id).toBe("tv-new");
    expect(prisma.transportVehicleVerification.createMany).toHaveBeenCalled();
  });
});

describe("deactivate fleet vehicle", () => {
  it("blocks deactivate when active assignment exists", async () => {
    vi.mocked(prisma.transportVehicle.findFirst).mockResolvedValue({
      id: "tv-1",
      organisationId: "org-1",
    } as never);
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue({
      id: "assign-1",
    } as never);

    await expect(
      updateFleetVehicle(providerUser, "org-1", "tv-1", { active: false })
    ).rejects.toMatchObject({ code: "TRANSPORT_VALIDATION_FAILED" });
  });
});
