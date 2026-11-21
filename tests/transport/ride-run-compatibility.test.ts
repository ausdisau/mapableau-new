import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";

vi.mock("@/lib/config/transport-accessible", () => ({
  transportAccessibleConfig: { ridePoolingEnabled: true, bookingBridgeEnabled: false },
}));

vi.mock("@/lib/transport/transport-access-policy", () => ({
  assertProviderOrgTrip: vi.fn().mockResolvedValue(undefined),
}));

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    rideRun: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transportTrip: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transportVehicle: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

vi.mock("@/lib/transport/transport-eligibility-service", () => ({
  checkVehicleEligibility: vi.fn().mockResolvedValue({ eligible: true, reasons: [] }),
}));

import { attachTripToRideRun } from "@/lib/transport/ride-run-service";
import { checkVehicleEligibility } from "@/lib/transport/transport-eligibility-service";

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

describe("ride-run compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkVehicleEligibility).mockResolvedValue({
      eligible: true,
      reasons: [],
    });
  });

  it("rejects attach without independent pooling consent", async () => {
    vi.mocked(prismaMock.rideRun.findFirst).mockResolvedValue({
      id: "run-1",
      providerOrganisationId: "org-1",
      vehicleId: "tv-1",
      status: "planning",
      requiresHumanReview: true,
      maxPassengers: 4,
      scheduledStart: new Date("2026-06-01T09:00:00Z"),
      scheduledEnd: new Date("2026-06-01T12:00:00Z"),
      trips: [],
      vehicle: {
        features: [{ wheelchairAccessible: true, metadata: { wheelchairSpaces: 2 } }],
      },
    } as never);
    vi.mocked(prismaMock.transportTrip.findUnique).mockResolvedValue({
      id: "trip-2",
      providerOrganisationId: "org-1",
      rideRunId: null,
      scheduledStart: new Date("2026-06-01T09:30:00Z"),
      scheduledEnd: new Date("2026-06-01T10:30:00Z"),
      mobilityRequirements: { requiresWheelchairAccessible: true },
    } as never);

    await expect(
      attachTripToRideRun(providerUser, "org-1", "run-1", "trip-2")
    ).rejects.toMatchObject({ code: "TRANSPORT_VALIDATION_FAILED" });
  });

  it("merges mobility with OR so earlier wheelchair need is preserved", async () => {
    vi.mocked(prismaMock.rideRun.findFirst).mockResolvedValue({
      id: "run-1",
      providerOrganisationId: "org-1",
      vehicleId: "tv-1",
      status: "planning",
      requiresHumanReview: true,
      maxPassengers: 4,
      scheduledStart: new Date("2026-06-01T09:00:00Z"),
      scheduledEnd: new Date("2026-06-01T12:00:00Z"),
      trips: [
        {
          id: "trip-1",
          mobilityRequirements: {
            requiresWheelchairAccessible: true,
            poolingAccepted: true,
            passengerCount: 1,
          },
          scheduledStart: new Date("2026-06-01T09:00:00Z"),
          scheduledEnd: new Date("2026-06-01T10:00:00Z"),
        },
      ],
      vehicle: {
        features: [
          {
            wheelchairAccessible: true,
            metadata: { wheelchairSpaces: 2, seatedPassengerCapacity: 4 },
          },
        ],
      },
    } as never);
    vi.mocked(prismaMock.transportTrip.findUnique).mockResolvedValue({
      id: "trip-2",
      providerOrganisationId: "org-1",
      rideRunId: null,
      scheduledStart: new Date("2026-06-01T09:15:00Z"),
      scheduledEnd: new Date("2026-06-01T10:15:00Z"),
      mobilityRequirements: {
        requiresWheelchairAccessible: false,
        poolingAccepted: true,
        passengerCount: 1,
      },
    } as never);
    vi.mocked(prismaMock.transportTrip.update).mockResolvedValue({} as never);
    vi.mocked(prismaMock.rideRun.findUnique).mockResolvedValue({ id: "run-1" } as never);

    await attachTripToRideRun(providerUser, "org-1", "run-1", "trip-2");

    expect(checkVehicleEligibility).toHaveBeenCalled();
    const mergedArg = vi.mocked(checkVehicleEligibility).mock.calls.at(-1)?.[1] as Record<
      string,
      unknown
    >;
    expect(mergedArg.requiresWheelchairAccessible).toBe(true);
  });

  it("enforces wheelchair securement capacity", async () => {
    vi.mocked(prismaMock.rideRun.findFirst).mockResolvedValue({
      id: "run-1",
      providerOrganisationId: "org-1",
      vehicleId: "tv-1",
      status: "planning",
      requiresHumanReview: true,
      maxPassengers: 4,
      scheduledStart: new Date("2026-06-01T09:00:00Z"),
      scheduledEnd: new Date("2026-06-01T12:00:00Z"),
      trips: [
        {
          id: "trip-1",
          mobilityRequirements: {
            requiresWheelchairAccessible: true,
            poolingAccepted: true,
            wheelchairSecurementRequired: 1,
          },
          scheduledStart: new Date("2026-06-01T09:00:00Z"),
          scheduledEnd: new Date("2026-06-01T10:00:00Z"),
        },
      ],
      vehicle: {
        features: [
          {
            wheelchairAccessible: true,
            metadata: { wheelchairSpaces: 1 },
          },
        ],
      },
    } as never);
    vi.mocked(prismaMock.transportTrip.findUnique).mockResolvedValue({
      id: "trip-2",
      providerOrganisationId: "org-1",
      rideRunId: null,
      scheduledStart: new Date("2026-06-01T09:15:00Z"),
      scheduledEnd: new Date("2026-06-01T10:15:00Z"),
      mobilityRequirements: {
        requiresWheelchairAccessible: true,
        poolingAccepted: true,
        wheelchairSecurementRequired: 1,
      },
    } as never);

    await expect(
      attachTripToRideRun(providerUser, "org-1", "run-1", "trip-2")
    ).rejects.toMatchObject({ code: "TRANSPORT_VEHICLE_NOT_ELIGIBLE" });
  });
});
