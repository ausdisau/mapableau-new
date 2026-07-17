import { describe, expect, it } from "vitest";

import { correlateSignal } from "@/lib/continuity/detection/correlation-service";

function stub(overrides: Partial<any> = {}) {
  return {
    id: "s-1",
    kind: "care_shift_cancelled",
    status: "validated",
    confidence: "high",
    participantId: "p-1",
    observedAt: new Date("2026-06-01"),
    staleAfter: new Date("2026-06-02"),
    dedupeKey: "d-1",
    ...overrides,
  } as any;
}

describe("signal correlation", () => {
  it("stale signal rejected", () => {
    const r = correlateSignal({ signal: stub({ status: "stale" }) });
    expect(r.action).toBe("reject_stale");
  });

  it("missing participant returns no_participant_no_case", () => {
    const r = correlateSignal({ signal: stub({ participantId: null }) });
    expect(r.action).toBe("no_participant_no_case");
  });

  it("validated + fresh + participant -> open_or_extend_case", () => {
    const r = correlateSignal({ signal: stub(), now: new Date("2026-06-01T12:00:00Z") });
    expect(r.action).toBe("open_or_extend_case");
  });

  it("low confidence held for review", () => {
    const r = correlateSignal({ signal: stub({ confidence: "low" }), now: new Date("2026-06-01T12:00:00Z") });
    expect(r.action).toBe("hold_for_review");
  });

  it("category mapping picks care for care_shift_cancelled", () => {
    const r = correlateSignal({ signal: stub(), now: new Date("2026-06-01T12:00:00Z") });
    expect(r.caseCategory).toBe("care");
  });

  it("category mapping picks provider_failure for provider_failure kind", () => {
    const r = correlateSignal({
      signal: stub({ kind: "provider_failure" }),
      now: new Date("2026-06-01T12:00:00Z"),
    });
    expect(r.caseCategory).toBe("provider_failure");
  });

  it("category mapping picks civic_disruption for external_civic_feed", () => {
    const r = correlateSignal({
      signal: stub({ kind: "external_civic_feed", staleAfter: new Date("2026-06-01T01:30:00Z") }),
      now: new Date("2026-06-01T00:00:00Z"),
    });
    expect(r.caseCategory).toBe("civic_disruption");
  });
});
