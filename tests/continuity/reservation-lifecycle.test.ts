import { describe, expect, it, vi, beforeEach } from "vitest";

const reservations = new Map<string, any>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    continuityCapacityReservation: {
      create: vi.fn(async (args: any) => {
        const r = { id: `r-${reservations.size + 1}`, ...args.data };
        reservations.set(r.id, r);
        return r;
      }),
      update: vi.fn(async (args: any) => {
        const cur = reservations.get(args.where.id);
        const updated = { ...cur, ...args.data };
        reservations.set(args.where.id, updated);
        return updated;
      }),
      updateMany: vi.fn(async () => ({ count: 0 })),
    },
  },
}));

import {
  createReservation,
  releaseReservation,
} from "@/lib/continuity/reservations/reservation-service";

beforeEach(() => reservations.clear());

describe("reservation lifecycle", () => {
  it("create with valid window returns held", async () => {
    const r = await createReservation({
      caseId: "case-1",
      organisationId: "org-1",
      resourceKind: "worker_shift",
      resourceRef: "shift-slot-1",
      windowStart: new Date("2026-07-01T09:00:00Z"),
      windowEnd: new Date("2026-07-01T11:00:00Z"),
      createdById: "u-1",
    });
    expect(r.status).toBe("held");
  });

  it("refuses invalid window", async () => {
    await expect(
      createReservation({
        resourceKind: "worker_shift",
        resourceRef: "x",
        windowStart: new Date("2026-07-01T11:00:00Z"),
        windowEnd: new Date("2026-07-01T09:00:00Z"),
        createdById: "u-1",
      })
    ).rejects.toThrow(/INVALID_WINDOW/);
  });

  it("release marks the row released with releasedById", async () => {
    const r = await createReservation({
      resourceKind: "worker_shift",
      resourceRef: "x",
      windowStart: new Date("2026-07-01T09:00:00Z"),
      windowEnd: new Date("2026-07-01T10:00:00Z"),
      createdById: "u-1",
    });
    const released = await releaseReservation(r.id, "u-2");
    expect(released.status).toBe("released");
    expect(released.releasedById).toBe("u-2");
  });
});
