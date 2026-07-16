import { afterEach, describe, expect, it } from "vitest";

import {
  ingestGtfsRealtimeShadow,
  mapWheelchairBoarding,
  resetGtfsRealtimeShadow,
  resolveTripAccessibility,
} from "@/lib/aura";

afterEach(() => resetGtfsRealtimeShadow());

describe("Wave 7 gap-fill — GTFS Realtime shadow", () => {
  it("rejects future and stale entities; vehicle access does not imply station", () => {
    const now = Date.parse("2026-07-16T12:00:00.000Z");
    const result = ingestGtfsRealtimeShadow({
      now,
      staleAfterMs: 5 * 60 * 1000,
      entities: [
        {
          entityId: "e-future",
          tripId: "t1",
          feedTimestamp: "2026-07-16T13:00:00.000Z",
          entityTimestamp: "2026-07-16T13:00:00.000Z",
          wheelchairAccessible: true,
        },
        {
          entityId: "e-stale",
          tripId: "t2",
          feedTimestamp: "2026-07-16T11:00:00.000Z",
          entityTimestamp: "2026-07-16T11:00:00.000Z",
          wheelchairAccessible: true,
        },
        {
          entityId: "e-ok",
          tripId: "t3",
          feedTimestamp: "2026-07-16T11:58:00.000Z",
          entityTimestamp: "2026-07-16T11:58:00.000Z",
          wheelchairAccessible: true,
        },
      ],
    });
    expect(result.rejected.length).toBe(2);
    expect(result.accepted.length).toBe(1);
    expect(result.accepted[0]?.vehicleAccessibilityDoesNotImplyStation).toBe(true);
    expect(resolveTripAccessibility({ staticValue: "unknown", entityId: "e-ok" })).toBe(
      "accessible",
    );
    expect(mapWheelchairBoarding(undefined)).toBe("unknown");
  });
});
