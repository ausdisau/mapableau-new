import { describe, expect, it } from "vitest";

import { createVirtualClock, resolveLocalTimeOnStartDay } from "@/lib/replay-lab";

describe("Replay Lab virtual clock", () => {
  it("is deterministic for pause, resume, step, and jump", () => {
    const clock = createVirtualClock({
      start: "2026-09-17T00:00:00+10:00",
      timeZone: "Australia/Sydney",
    });

    clock.schedule({ id: "a", atMs: clock.nowMs() + 60_000, label: "one-minute" });
    clock.schedule({ id: "b", atMs: clock.nowMs() + 120_000, label: "two-minute" });

    clock.pause();
    clock.advance(999_999);
    expect(clock.nowMs()).toBe(Date.parse("2026-09-17T00:00:00+10:00"));

    clock.resume();
    const first = clock.step();
    expect(first?.id).toBe("a");
    const second = clock.step();
    expect(second?.id).toBe("b");

    const snap = clock.snapshot();
    clock.jumpToMs(snap.nowMs - 30_000);
    clock.restore(snap);
    expect(clock.nowMs()).toBe(snap.nowMs);
  });

  it("resolves local HH:mm on the start day deterministically", () => {
    const clock = createVirtualClock({
      start: "2026-09-17T00:00:00+10:00",
      timeZone: "Australia/Sydney",
    });
    const at = resolveLocalTimeOnStartDay(clock, "06:45");
    expect(clock.formatLocalTime(at)).toBe("06:45");
  });

  it("supports acceleration and recurring schedule", () => {
    const clock = createVirtualClock({
      start: "2026-09-17T00:00:00+10:00",
      acceleration: 2,
    });
    clock.schedule({
      id: "tick",
      atMs: clock.nowMs() + 1000,
      label: "tick",
      recurringIntervalMs: 1000,
    });
    const a = clock.step();
    expect(a?.id).toBe("tick");
    const remaining = clock.listScheduled();
    expect(remaining.some((e) => e.id === "tick")).toBe(true);
    clock.advance(500);
    expect(clock.nowMs()).toBe(a!.atMs + 1000);
  });
});
