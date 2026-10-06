import { describe, expect, it } from "vitest";

import {
  getZonedDayBoundsUtc,
  getZonedHour,
} from "@/lib/time/zoned-day";

describe("zoned-day", () => {
  it("uses participant-local hour instead of server/UTC hour", () => {
    const reference = new Date("2026-10-07T00:30:00.000Z");
    expect(getZonedHour(reference, "Australia/Sydney")).toBe(11);
  });

  it("returns a 23-hour Sydney day across daylight-saving start", () => {
    const reference = new Date("2026-10-04T01:00:00.000Z");
    const bounds = getZonedDayBoundsUtc(reference, "Australia/Sydney");

    expect(bounds.start.toISOString()).toBe("2026-10-03T14:00:00.000Z");
    expect(bounds.endExclusive.toISOString()).toBe(
      "2026-10-04T13:00:00.000Z",
    );
    expect(
      (bounds.endExclusive.getTime() - bounds.start.getTime()) / 3_600_000,
    ).toBe(23);
  });
});
