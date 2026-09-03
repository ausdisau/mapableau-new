import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  REVOCATION_PROPAGATION_SLA_MS,
  assertRevocationPropagatedWithinSla,
  getPassportProjection,
  invalidatePassportProjectionCache,
  isPassportProjectionCacheValid,
  resetPassportProjectionCacheForTests,
  setPassportProjection,
} from "@/lib/passport";

describe("passport projection cache revocation", () => {
  const participantId = "participant-1";
  const projectionId = "compat-v1";

  beforeEach(() => {
    resetPassportProjectionCacheForTests();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-02T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    resetPassportProjectionCacheForTests();
  });

  it("serves cached projection until revocation invalidates it", () => {
    setPassportProjection(participantId, projectionId, { state: "compatible" });
    expect(getPassportProjection(participantId, projectionId)).toEqual({
      state: "compatible",
    });
    expect(isPassportProjectionCacheValid(participantId, projectionId)).toBe(true);

    const { revokedAtMs } = invalidatePassportProjectionCache(participantId);

    expect(getPassportProjection(participantId, projectionId)).toBeNull();
    expect(isPassportProjectionCacheValid(participantId, projectionId)).toBe(false);
    expect(revokedAtMs).toBe(Date.parse("2026-09-02T10:00:00.000Z"));
  });

  it("propagates revocation within the sub-60-second SLA", () => {
    setPassportProjection(participantId, projectionId, { token: "active" });
    const { revokedAtMs } = invalidatePassportProjectionCache(participantId);

    vi.advanceTimersByTime(REVOCATION_PROPAGATION_SLA_MS - 1);

    expect(
      assertRevocationPropagatedWithinSla({
        participantId,
        projectionId,
        revokedAtMs,
      }),
    ).toBe(true);
    expect(isPassportProjectionCacheValid(participantId, projectionId)).toBe(false);
  });

  it("remains invalid after SLA window elapses", () => {
    setPassportProjection(participantId, projectionId, { token: "active" });
    const { revokedAtMs } = invalidatePassportProjectionCache(participantId);

    vi.advanceTimersByTime(REVOCATION_PROPAGATION_SLA_MS + 5_000);

    expect(
      assertRevocationPropagatedWithinSla({
        participantId,
        projectionId,
        revokedAtMs,
      }),
    ).toBe(true);
    expect(getPassportProjection(participantId, projectionId)).toBeNull();
  });

  it("does not invalidate other participants' projections", () => {
    setPassportProjection("participant-a", projectionId, { a: true });
    setPassportProjection("participant-b", projectionId, { b: true });

    invalidatePassportProjectionCache("participant-a");

    expect(getPassportProjection("participant-a", projectionId)).toBeNull();
    expect(getPassportProjection("participant-b", projectionId)).toEqual({ b: true });
  });
});
