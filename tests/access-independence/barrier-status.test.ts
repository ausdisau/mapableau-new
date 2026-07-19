import { describe, expect, it } from "vitest";

import { canTransitionBarrierStatus } from "@/lib/barrier-report/status";

describe("barrier report status workflow", () => {
  it("allows received → reviewing → actioned → closed", () => {
    expect(canTransitionBarrierStatus("received", "reviewing")).toBe(true);
    expect(canTransitionBarrierStatus("reviewing", "actioned")).toBe(true);
    expect(canTransitionBarrierStatus("actioned", "closed")).toBe(true);
  });

  it("rejects invalid transitions and draft returns", () => {
    expect(canTransitionBarrierStatus("received", "actioned")).toBe(false);
    expect(canTransitionBarrierStatus("closed", "reviewing")).toBe(false);
    expect(canTransitionBarrierStatus("reviewing", "draft")).toBe(false);
    expect(canTransitionBarrierStatus("draft", "received")).toBe(false);
  });
});
