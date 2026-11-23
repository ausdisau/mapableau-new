import { describe, expect, it } from "vitest";

import {
  locationStageForTripStatus,
  sydneyDayBounds,
} from "@/lib/transport/schedule/schedule-matrix-service";
import { projectLocationForStage } from "@/lib/transport/privacy/location-disclosure";

describe("sydneyDayBounds", () => {
  it("returns a 24h UTC window for a Sydney civil day", () => {
    const { start, end } = sydneyDayBounds("2026-06-01");
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    // June is AEST (UTC+10)
    expect(start.toISOString()).toBe("2026-05-31T14:00:00.000Z");
  });

  it("handles DST boundary (AEDT mid-summer)", () => {
    const { start, end } = sydneyDayBounds("2026-01-15");
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    // January is AEDT (UTC+11)
    expect(start.toISOString()).toBe("2026-01-14T13:00:00.000Z");
  });
});

describe("schedule location masking", () => {
  it("masks provider exact address before assignment", () => {
    const stage = locationStageForTripStatus("accepted");
    const view = projectLocationForStage({
      stage,
      suburb: "Parramatta",
      exactAddress: "1 Secret St",
      coordinates: { lat: -33.8, lng: 151.0 },
      role: "provider",
    });
    expect(view.redacted).toBe(true);
    expect(view.exactAddress).toBeUndefined();
    expect(view.coordinates).toBeUndefined();
  });

  it("reveals coordinates after assignment for providers", () => {
    const stage = locationStageForTripStatus("driver_vehicle_assigned");
    const view = projectLocationForStage({
      stage,
      suburb: "Parramatta",
      exactAddress: "1 Secret St",
      coordinates: { lat: -33.8, lng: 151.0 },
      role: "provider",
    });
    expect(view.redacted).toBe(false);
    expect(view.coordinates).toEqual({ lat: -33.8, lng: 151.0 });
  });
});

describe("15-minute slot flooring", () => {
  it("documents slot alignment expectation", () => {
    const slotMinutes = 15;
    const ms = slotMinutes * 60_000;
    const t = new Date("2026-06-01T09:07:00.000Z");
    const floored = new Date(Math.floor(t.getTime() / ms) * ms);
    expect(floored.toISOString()).toBe("2026-06-01T09:00:00.000Z");
  });
});
