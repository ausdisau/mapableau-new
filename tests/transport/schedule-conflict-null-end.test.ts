import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    transportDispatchAssignment: { findMany: vi.fn() },
    transportDriverAvailability: { findFirst: vi.fn() },
    transportScheduleConflict: { createMany: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { detectScheduleConflicts } from "@/lib/transport/transport-schedule-conflict-service";

describe("schedule conflict null scheduledEnd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prismaMock.transportDriverAvailability.findFirst).mockResolvedValue(
      null
    );
  });

  it("treats vehicle open-ended trips as overlapping (same as driver)", async () => {
    vi.mocked(prismaMock.transportDispatchAssignment.findMany)
      .mockResolvedValueOnce([]) // driver
      .mockResolvedValueOnce([
        { tripId: "other-trip", trip: { scheduledEnd: null } },
      ] as never); // vehicle

    const result = await detectScheduleConflicts({
      tripId: "trip-1",
      driverId: "d1",
      vehicleId: "v1",
      scheduledStart: new Date("2026-06-01T09:00:00Z"),
      scheduledEnd: new Date("2026-06-01T10:00:00Z"),
    });

    expect(result.hasConflict).toBe(true);
    expect(result.conflicts.some((c) => c.conflictType === "vehicle_trip_overlap")).toBe(
      true
    );

    const vehicleCall = vi.mocked(prismaMock.transportDispatchAssignment.findMany).mock
      .calls[1]?.[0] as { where: { trip: { OR: unknown[] } } };
    expect(vehicleCall.where.trip.OR).toEqual(
      expect.arrayContaining([
        { scheduledEnd: null },
        expect.objectContaining({ scheduledEnd: expect.anything() }),
      ])
    );
  });
});
