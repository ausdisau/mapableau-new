import { describe, expect, it } from "vitest";

import {
  addBusinessDays,
  classifyDeadlineStatus,
  computeDeadlineDueAt,
  isBusinessDay,
  isHoliday,
  toDateKey,
} from "@/lib/quality-safeguards/deadline-engine";

describe("quality-safeguards deadline engine", () => {
  it("skips weekends when adding business days", () => {
    const friday = new Date("2026-07-03T10:00:00+10:00");
    const due = addBusinessDays(friday, 1, [], "Australia/Sydney");
    expect(toDateKey(due, "Australia/Sydney")).toBe("2026-07-06");
  });

  it("skips configured holidays", () => {
    // 2026-04-25 is ANZAC Day (Saturday) — use a weekday holiday stub
    const before = new Date("2026-06-05T10:00:00+10:00"); // Friday before Queen’s Birthday Mon 8 Jun 2026
    expect(isHoliday(new Date("2026-06-08T12:00:00+10:00"))).toBe(true);
    const due = addBusinessDays(before, 1);
    expect(toDateKey(due, "Australia/Sydney")).toBe("2026-06-09");
  });

  it("computes hour-based deadlines", () => {
    const from = new Date("2026-07-01T09:00:00.000Z");
    const due = computeDeadlineDueAt(from, { kind: "hours", value: 24 });
    expect(due.toISOString()).toBe("2026-07-02T09:00:00.000Z");
  });

  it("computes calendar-day deadlines", () => {
    const from = new Date("2026-07-01T09:00:00.000Z");
    const due = computeDeadlineDueAt(from, { kind: "calendarDays", value: 7 });
    expect(due.getUTCDate()).toBe(8);
  });

  it("classifies overdue and due_soon statuses", () => {
    const now = new Date("2026-07-10T12:00:00.000Z");
    expect(
      classifyDeadlineStatus(new Date("2026-07-10T11:00:00.000Z"), now)
    ).toBe("overdue");
    expect(
      classifyDeadlineStatus(new Date("2026-07-11T12:00:00.000Z"), now)
    ).toBe("due_soon");
    expect(
      classifyDeadlineStatus(new Date("2026-07-20T12:00:00.000Z"), now)
    ).toBe("pending");
  });

  it("treats Monday as a business day when not a holiday", () => {
    const monday = new Date("2026-07-06T10:00:00+10:00");
    expect(isBusinessDay(monday, [], "Australia/Sydney")).toBe(true);
  });
});
