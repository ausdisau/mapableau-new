import { describe, expect, it } from "vitest";

import {
  addCalendarDays,
  formatSydneyTime,
  formatStatus,
  getReadWindow,
  getWeekDates,
  isCompletedStatus,
  isValidDateOnly,
  isWithinWeek,
  mondayOfWeek,
  needsAttention,
  sydneyDateKey,
} from "@/lib/care/scheduler/ui-model";

describe("Care Scheduler presentation model", () => {
  it("rejects impossible dates rather than silently normalising them", () => {
    expect(isValidDateOnly("2026-02-30")).toBe(false);
    expect(isValidDateOnly("2026-11-23")).toBe(true);
    expect(isValidDateOnly("2026-2-3")).toBe(false);
  });

  it("normalises requested weeks to Monday using date-only arithmetic", () => {
    expect(mondayOfWeek("2026-11-21")).toBe("2026-11-16");
    expect(mondayOfWeek("2026-11-23")).toBe("2026-11-23");
    expect(getWeekDates("2026-11-23")).toEqual([
      "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26",
      "2026-11-27", "2026-11-28", "2026-11-29",
    ]);
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("uses the Sydney calendar at a DST boundary rather than UTC dates", () => {
    expect(sydneyDateKey("2026-10-03T14:30:00.000Z")).toBe("2026-10-04");
    expect(sydneyDateKey("2026-10-03T16:30:00.000Z")).toBe("2026-10-04");
    expect(formatSydneyTime("2026-10-03T16:30:00.000Z")).toBe("03:30");
    expect(sydneyDateKey("2026-04-04T16:30:00.000Z")).toBe("2026-04-05");
  });

  it("adds a bounded read window and filters back to the requested local week", () => {
    const window = getReadWindow("2026-11-23");
    expect(window.from.toISOString()).toBe("2026-11-22T00:00:00.000Z");
    expect(window.to.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(isWithinWeek("2026-11-23", "2026-11-23")).toBe(true);
    expect(isWithinWeek("2026-11-29", "2026-11-23")).toBe(true);
    expect(isWithinWeek("2026-11-30", "2026-11-23")).toBe(false);
  });

  it("does not treat an unallocated scheduled shift as confirmed", () => {
    expect(needsAttention("scheduled", null)).toBe(true);
    expect(needsAttention("scheduled", "worker-1")).toBe(false);
    expect(needsAttention("no_show", "worker-1")).toBe(true);
    expect(needsAttention("awaiting_participant_approval", "worker-1")).toBe(true);
    expect(isCompletedStatus("approved")).toBe(true);
    expect(isCompletedStatus("worker_assigned")).toBe(false);
    expect(formatStatus("worker_assigned")).toBe("Worker Assigned");
  });
});
