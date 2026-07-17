import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ACCESSCAST_OFFLINE_STORAGE_KEY,
  __resetAccessCastOfflineStoreForTests,
  clearAccessCastOfflineLocal,
  compileAccessCastOfflinePack,
  evaluateAccessCastOfflinePack,
  hashAccessCastOfflineContent,
  loadAccessCastOfflineLocal,
  saveAccessCastOfflineLocal,
} from "@/lib/accesscast";
import {
  ACCESSCAST_OFFLINE_STORAGE_KEY_CONTRACT,
  accessCastOfflinePackSchema,
} from "@/mobile-contracts/schemas/accesscast-offline";

beforeEach(() => {
  process.env.MAPABLE_ACCESSCAST_ENABLED = "true";
  process.env.MAPABLE_ACCESSCAST_MODE = "synthetic";
  __resetAccessCastOfflineStoreForTests();
});

afterEach(() => {
  delete process.env.MAPABLE_ACCESSCAST_ENABLED;
  delete process.env.MAPABLE_ACCESSCAST_MODE;
  __resetAccessCastOfflineStoreForTests();
});

describe("AccessCast offline Companion pack", () => {
  it("compiles a redacted offline pack with generated time and expiry", () => {
    const pack = compileAccessCastOfflinePack({
      journey: { scenario: "starting_work_tomorrow" },
      generatedAt: "2026-07-16T18:00:00.000+10:00",
    });

    expect(pack.offlineBounded).toBe(true);
    expect(pack.mustShowGeneratedAndExpiry).toBe(true);
    expect(pack.redacted).toBe(true);
    expect(pack.productionClaim).toBe("none");
    expect(pack.generatedAt).toBeTruthy();
    expect(pack.expiresAt).toBeTruthy();
    expect(pack.contentHash.length).toBeGreaterThan(16);
    expect(pack.limitations.some((l) => /offline/i.test(l))).toBe(true);

    const parsed = accessCastOfflinePackSchema.safeParse(pack);
    expect(parsed.success).toBe(true);
  });

  it("marks expired offline packs as stale — never silently current", () => {
    const pack = compileAccessCastOfflinePack({
      journey: { scenario: "starting_work_tomorrow" },
      generatedAt: "2026-07-15T08:00:00.000+10:00",
      ttlHours: 1,
    });
    const expiresAt = "2026-07-15T10:00:00.000+10:00";
    const { contentHash: _discard, ...packBody } = pack;
    const expired = {
      ...pack,
      expiresAt,
      contentHash: hashAccessCastOfflineContent({
        ...packBody,
        expiresAt,
      }),
    };

    const evaluation = evaluateAccessCastOfflinePack({
      saved: expired,
      asOf: "2026-07-16T22:00:00.000+10:00",
    });

    expect(evaluation.isExpired).toBe(true);
    expect(evaluation.displayState).toBe("stale");
    expect(evaluation.statusLabel).toMatch(/not current/i);
    expect(evaluation.displayLimitations.some((l) => /expired/i.test(l))).toBe(true);
  });

  it("detects changed-since-saved via content hash", () => {
    const pack = compileAccessCastOfflinePack({
      journey: { scenario: "starting_work_tomorrow" },
    });
    const { contentHash: _discard, ...packBody } = pack;
    const newerHash = hashAccessCastOfflineContent({
      ...packBody,
      conclusionState: "temporarily_unavailable",
    });

    const evaluation = evaluateAccessCastOfflinePack({
      saved: pack,
      asOf: pack.generatedAt,
      latestContentHash: newerHash,
    });

    expect(evaluation.changedSinceSaved).toBe(true);
    expect(evaluation.statusLabel).toMatch(/newer outlook/i);
  });

  it("persists via secure local storage contract key", async () => {
    expect(ACCESSCAST_OFFLINE_STORAGE_KEY).toBe(
      ACCESSCAST_OFFLINE_STORAGE_KEY_CONTRACT,
    );

    const pack = compileAccessCastOfflinePack();
    await saveAccessCastOfflineLocal(pack);
    const loaded = await loadAccessCastOfflineLocal();
    expect(loaded?.forecastId).toBe(pack.forecastId);
    expect(loaded?.contentHash).toBe(pack.contentHash);

    await clearAccessCastOfflineLocal();
    expect(await loadAccessCastOfflineLocal()).toBeNull();
  });

  it("does not claim journey guaranteed after offline save", () => {
    const pack = compileAccessCastOfflinePack();
    expect(pack.plainLanguageSummary.toLowerCase()).not.toMatch(/guaranteed/);
    expect(pack.limitations.join(" ")).toMatch(/not a safety guarantee/i);
  });
});
