import { describe, expect, it } from "vitest";

import { buildBookingBundle, calculatePickupWindow } from "@/lib/demo/care-transport-summary";

describe("care-transport summary", () => {
  it("calculates pickup buffer before care start", () => {
    const careStart = new Date("2026-06-15T10:00:00");
    const window = calculatePickupWindow(careStart, 30);
    expect(window.bufferMinutes).toBe(30);
    expect(window.pickupWindowStart.getTime()).toBe(careStart.getTime() - 30 * 60 * 1000);
    expect(window.pickupWindowEnd.getTime()).toBe(careStart.getTime());
  });

  it("builds a booking bundle with placeholder claim guidance", () => {
    const start = new Date("2026-06-15T10:00:00");
    const bundle = buildBookingBundle({
      care: {
        supportType: "personal_care",
        scheduledStart: start,
        scheduledEnd: new Date(start.getTime() + 2 * 60 * 60 * 1000),
      },
      trip: {
        pickupAddress: "1 Main St",
        destinationAddress: "Clinic",
        scheduledPickup: start,
      },
      accessNeeds: ["wheelchair_ramp"],
      fundingSource: "ndis",
    });
    expect(bundle.claimCategoryPlaceholder).toMatch(/Guidance only/i);
    expect(bundle.bufferMinutes).toBeGreaterThan(0);
  });
});
