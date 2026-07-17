import { describe, expect, it } from "vitest";

import {
  canReleaseHold,
  isBlockedBySafetyHold,
  type SafetyHoldRecord,
} from "@/lib/aura/safety/holds";

function hold(overrides: Partial<SafetyHoldRecord> = {}): SafetyHoldRecord {
  return {
    id: "h1",
    reason: "participant_paused",
    status: "active",
    affectsAgentId: null,
    affectsParticipantId: null,
    ...overrides,
  };
}

describe("safety holds", () => {
  it("participant pause blocks matching participant", () => {
    const h = hold({
      reason: "participant_paused",
      affectsParticipantId: "p1",
    });
    expect(isBlockedBySafetyHold([h], { participantId: "p1" })).toBeTruthy();
    expect(isBlockedBySafetyHold([h], { participantId: "p2" })).toBeNull();
  });

  it("consent withdrawal creates an active hold", () => {
    const h = hold({
      reason: "consent_withdrawn",
      affectsParticipantId: "p1",
    });
    expect(isBlockedBySafetyHold([h], { participantId: "p1" })).toBeTruthy();
  });

  it("released hold no longer blocks", () => {
    const h = hold({ status: "released", affectsParticipantId: "p1" });
    expect(isBlockedBySafetyHold([h], { participantId: "p1" })).toBeNull();
  });

  it("AURA agent cannot release its own hold", () => {
    const h = hold({ reason: "kill_switch" });
    const result = canReleaseHold(h, {
      userId: "u_aura",
      isAgent: true,
      isSafetyOfficer: false,
    });
    expect(result.ok).toBe(false);
  });

  it("kill switch requires safety officer", () => {
    const h = hold({ reason: "kill_switch" });
    const result = canReleaseHold(h, {
      userId: "u1",
      isAgent: false,
      isSafetyOfficer: false,
    });
    expect(result.ok).toBe(false);
    const ok = canReleaseHold(h, {
      userId: "u1",
      isAgent: false,
      isSafetyOfficer: true,
    });
    expect(ok.ok).toBe(true);
  });
});
