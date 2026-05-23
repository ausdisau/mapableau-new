import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scheduledAssignment: { findFirst: vi.fn().mockResolvedValue(null) },
    careShift: { findFirst: vi.fn().mockResolvedValue(null) },
    transportBooking: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

import { assertNoDoubleBooking } from "@/lib/scheduling/conflict-detector";

describe("conflict-detector", () => {
  it("passes when no overlaps", async () => {
    await expect(
      assertNoDoubleBooking({
        resourceType: "worker",
        resourceId: "w1",
        startsAt: new Date("2026-06-01T09:00:00Z"),
        endsAt: new Date("2026-06-01T11:00:00Z"),
      })
    ).resolves.toBeUndefined();
  });
});
