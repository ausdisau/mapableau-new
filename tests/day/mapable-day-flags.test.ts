import { afterEach, describe, expect, it } from "vitest";

import { mapableDayFlags } from "@/lib/config/mapable-day";

const FLAG_KEYS = [
  "MAPABLE_DAY_V2_ENABLED",
  "MAPABLE_DAY_ROUTINES_DEMO_ENABLED",
  "MAPABLE_DAY_HANDOVER_DEMO_ENABLED",
  "MAPABLE_DAY_CONTINUITY_DEMO_ENABLED",
  "MAPABLE_DAY_QR_ACCESS_ENABLED",
  "MAPABLE_DAY_LIVE_WRITES_ENABLED",
] as const;

afterEach(() => {
  for (const key of FLAG_KEYS) {
    delete process.env[key];
  }
});

describe("MapAble Day 2.0 flags", () => {
  it("defaults all demos off", () => {
    const env = {} as NodeJS.ProcessEnv;
    expect(mapableDayFlags.v2Enabled(env)).toBe(false);
    expect(mapableDayFlags.routinesDemoEnabled(env)).toBe(false);
    expect(mapableDayFlags.handoverDemoEnabled(env)).toBe(false);
    expect(mapableDayFlags.continuityDemoEnabled(env)).toBe(false);
  });

  it("requires v2 parent for demo children", () => {
    const env = {
      MAPABLE_DAY_ROUTINES_DEMO_ENABLED: "true",
      MAPABLE_DAY_HANDOVER_DEMO_ENABLED: "true",
      MAPABLE_DAY_CONTINUITY_DEMO_ENABLED: "true",
    } as unknown as NodeJS.ProcessEnv;
    expect(mapableDayFlags.routinesDemoEnabled(env)).toBe(false);
    expect(mapableDayFlags.handoverDemoEnabled(env)).toBe(false);
    expect(mapableDayFlags.continuityDemoEnabled(env)).toBe(false);

    const withParent = {
      ...env,
      MAPABLE_DAY_V2_ENABLED: "true",
    } as unknown as NodeJS.ProcessEnv;
    expect(mapableDayFlags.routinesDemoEnabled(withParent)).toBe(true);
    expect(mapableDayFlags.handoverDemoEnabled(withParent)).toBe(true);
    expect(mapableDayFlags.continuityDemoEnabled(withParent)).toBe(true);
  });

  it("hard-offs QR and live writes even when env claims true", () => {
    const env = {
      MAPABLE_DAY_QR_ACCESS_ENABLED: "true",
      MAPABLE_DAY_LIVE_WRITES_ENABLED: "true",
      MAPABLE_DAY_V2_ENABLED: "true",
    } as unknown as NodeJS.ProcessEnv;
    expect(mapableDayFlags.qrAccessEnabled(env)).toBe(false);
    expect(mapableDayFlags.liveWritesEnabled(env)).toBe(false);
  });
});
