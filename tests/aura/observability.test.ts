import { describe, expect, it } from "vitest";

import { summariseEvent } from "@/lib/aura/observability/events";

describe("aura observability", () => {
  it("summarises authority.evaluated", () => {
    expect(
      summariseEvent({
        kind: "authority.evaluated",
        verdict: "allowed",
        envelopeId: "e1",
      })
    ).toContain("authority verdict=allowed");
  });

  it("summarises safety.hold_triggered", () => {
    expect(
      summariseEvent({
        kind: "safety.hold_triggered",
        reason: "kill_switch",
      })
    ).toContain("kill_switch");
  });

  it("summarises plan.simulated", () => {
    expect(
      summariseEvent({
        kind: "plan.simulated",
        planId: "p1",
        externalWrites: 0,
        ok: true,
      })
    ).toContain("writes=0");
  });
});
