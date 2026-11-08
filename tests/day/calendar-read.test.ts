import { describe, expect, it } from "vitest";

import {
  formatSydneyDay,
  parseCalendarDay,
  projectCalendarDay,
} from "@/lib/day/calendar-read";

describe("MapAble Day calendar read helpers", () => {
  it("formats Sydney calendar days independently of server timezone", () => {
    expect(formatSydneyDay(new Date("2026-04-01T14:00:00.000Z"))).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });

  it("rejects invalid or out-of-window days", () => {
    expect(parseCalendarDay("not-a-day")).toBeNull();
    expect(parseCalendarDay("2026-02-30")).toBeNull();
  });

  it("projects only the selected day and marks evidence unverified", () => {
    const selected = parseCalendarDay("2026-11-09", new Date("2026-11-09T01:00:00.000Z"));
    expect(selected).not.toBeNull();
    const projected = projectCalendarDay(
      [
        {
          id: "a",
          title: "Care",
          eventType: "care",
          startAt: new Date("2026-11-08T22:00:00.000Z"),
          endAt: new Date("2026-11-08T23:00:00.000Z"),
        },
        {
          id: "b",
          title: "Other day",
          eventType: "care",
          startAt: new Date("2026-11-10T22:00:00.000Z"),
          endAt: new Date("2026-11-10T23:00:00.000Z"),
        },
      ],
      selected!.day,
    );
    for (const event of projected.events) {
      expect(event.evidenceStatus).toBe("recorded_unverified");
    }
  });
});
