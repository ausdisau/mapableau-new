import { describe, expect, it } from "vitest";

import {
  canPausePilot,
  canResumePilot,
  pauseBlocksNewOperations,
} from "@/lib/pilot/safety/pause-policy";

describe("pilot pause policy", () => {
  it("pause blocks new operations", () => {
    expect(canPausePilot("active")).toBe(true);
    expect(pauseBlocksNewOperations("paused")).toBe(true);
    expect(pauseBlocksNewOperations("active")).toBe(false);
    expect(canResumePilot("paused")).toBe(true);
    expect(canResumePilot("active")).toBe(false);
  });
});
