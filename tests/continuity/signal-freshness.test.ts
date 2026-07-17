import { describe, expect, it } from "vitest";

import {
  computeDefaultStaleAfter,
  isSignalDestructivelyUsable,
} from "@/lib/continuity/signals/signal-service";

function signalStub(overrides: Partial<any> = {}) {
  return {
    id: "s-1",
    kind: "care_shift_cancelled",
    status: "validated",
    confidence: "high",
    participantId: "p-1",
    organisationId: null,
    sourceKind: null,
    sourceRef: null,
    lifeEventId: null,
    payloadJson: null,
    observedAt: new Date("2026-06-01T00:00:00Z"),
    validatedAt: new Date("2026-06-01T00:00:01Z"),
    staleAfter: new Date("2026-06-02T00:00:00Z"),
    dedupeKey: "dedupe-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
}

describe("signal freshness and destructive usability", () => {
  it("validated + fresh + high confidence => usable", () => {
    const s = signalStub();
    const r = isSignalDestructivelyUsable(s, new Date("2026-06-01T12:00:00Z"));
    expect(r.usable).toBe(true);
  });

  it("stale status blocks destructive use", () => {
    const r = isSignalDestructivelyUsable(signalStub({ status: "stale" }));
    expect(r.usable).toBe(false);
    expect(r.reason).toBe("stale");
  });

  it("expired freshness blocks destructive use even if status is validated", () => {
    const r = isSignalDestructivelyUsable(
      signalStub({ staleAfter: new Date("2020-01-01") }),
      new Date("2026-06-01")
    );
    expect(r.usable).toBe(false);
    expect(r.reason).toBe("expired_freshness");
  });

  it("low confidence blocks destructive use", () => {
    const r = isSignalDestructivelyUsable(
      signalStub({ confidence: "low" }),
      new Date("2026-06-01T12:00:00Z")
    );
    expect(r.usable).toBe(false);
    expect(r.reason).toBe("low_confidence");
  });

  it("received (not validated) blocks destructive use", () => {
    const r = isSignalDestructivelyUsable(
      signalStub({ status: "received" }),
      new Date("2026-06-01T12:00:00Z")
    );
    expect(r.usable).toBe(false);
    expect(r.reason).toBe("not_validated");
  });

  it("computeDefaultStaleAfter uses 1h for external civic feed", () => {
    const obs = new Date("2026-06-01T00:00:00Z");
    const stale = computeDefaultStaleAfter("external_civic_feed", obs);
    expect(stale.getTime() - obs.getTime()).toBe(60 * 60 * 1000);
  });

  it("computeDefaultStaleAfter uses 24h for care_shift_cancelled", () => {
    const obs = new Date("2026-06-01T00:00:00Z");
    const stale = computeDefaultStaleAfter("care_shift_cancelled", obs);
    expect(stale.getTime() - obs.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});
