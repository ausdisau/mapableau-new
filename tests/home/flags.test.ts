import { afterEach, describe, expect, it } from "vitest";

import {
  mapableHomeDisabledResponse,
  mapableHomeFlags,
} from "@/lib/config/mapable-home";

const FLAG_KEYS = [
  "MAPABLE_HOME_ENV_ENABLED",
  "MAPABLE_HOME_ENV_LABS_ENABLED",
  "MAPABLE_HOME_ENV_SIMULATOR_ENABLED",
  "MAPABLE_HOME_ENV_GOOGLE_ENABLED",
  "MAPABLE_HOME_ENV_ALEXA_ENABLED",
  "MAPABLE_HOME_ENV_MATTER_ENABLED",
  "MAPABLE_HOME_ENV_REAL_DEVICE_ACTIONS_ENABLED",
] as const;

afterEach(() => {
  for (const key of FLAG_KEYS) delete process.env[key];
});

describe("mapableHomeFlags", () => {
  it("defaults all flags OFF when unset", () => {
    expect(mapableHomeFlags.enabled).toBe(false);
    expect(mapableHomeFlags.labsEnabled).toBe(false);
    expect(mapableHomeFlags.simulatorEnabled).toBe(false);
    expect(mapableHomeFlags.googleEnabled).toBe(false);
    expect(mapableHomeFlags.alexaEnabled).toBe(false);
    expect(mapableHomeFlags.matterEnabled).toBe(false);
    expect(mapableHomeFlags.realDeviceActionsEnabled).toBe(false);
  });

  it("only enables when value is exactly true", () => {
    process.env.MAPABLE_HOME_ENV_ENABLED = "TRUE";
    expect(mapableHomeFlags.enabled).toBe(false);
    process.env.MAPABLE_HOME_ENV_ENABLED = "true";
    expect(mapableHomeFlags.enabled).toBe(true);
  });

  it("returns a fail-closed disabled response", async () => {
    const res = mapableHomeDisabledResponse("MAPABLE_HOME_ENV_ENABLED");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.enabled).toBe(false);
    expect(body.claimState).toBe("PROPOSED_IN_DEVELOPMENT");
  });
});
