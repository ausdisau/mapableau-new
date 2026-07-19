import { describe, expect, it } from "vitest";

import {
  DEFAULT_TASK_IDLE_MS,
  LONGER_TASK_IDLE_MS,
  resolveTaskIdleMs,
} from "@/lib/forms/task-idle";

describe("task idle timing", () => {
  it("uses a longer delay when longer task time is enabled", () => {
    expect(resolveTaskIdleMs(false)).toBe(DEFAULT_TASK_IDLE_MS);
    expect(resolveTaskIdleMs(true)).toBe(LONGER_TASK_IDLE_MS);
    expect(LONGER_TASK_IDLE_MS).toBeGreaterThan(DEFAULT_TASK_IDLE_MS);
  });
});
