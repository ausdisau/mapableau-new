import { describe, expect, it } from "vitest";

import {
  canTransitionPersonaState,
  transitionPersonaState,
} from "@/lib/virtual-persona/state-machine";

describe("virtual-persona state machine", () => {
  it("allows processing to stopped", () => {
    expect(canTransitionPersonaState("processing", "stopped")).toBe(true);
    expect(transitionPersonaState("processing", "stopped")).toBe("stopped");
  });

  it("rejects illegal jumps", () => {
    expect(canTransitionPersonaState("idle", "draft_editing")).toBe(false);
    expect(() => transitionPersonaState("idle", "draft_editing")).toThrow(
      /Invalid persona state transition/,
    );
  });
});
