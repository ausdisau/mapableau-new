import { afterEach, describe, expect, it } from "vitest";

import {
  getOpenInfrastructureFlagMatrix,
  openInfrastructureFlags,
} from "@/lib/integrations/access/flags";

describe("openInfrastructureFlags fail-closed", () => {
  afterEach(() => {
    delete process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED;
    delete process.env.MAPABLE_PANORAMAX_INTEGRATION_ENABLED;
    delete process.env.MAPABLE_ACCESS_QUESTS_ENABLED;
    delete process.env.MAPABLE_OPEN311_ENABLED;
  });

  it("defaults all flags to false", () => {
    expect(openInfrastructureFlags.enabled).toBe(false);
    expect(openInfrastructureFlags.panoramax).toBe(false);
    expect(openInfrastructureFlags.accessQuests).toBe(false);
    expect(openInfrastructureFlags.open311).toBe(false);
    expect(openInfrastructureFlags.accessibleRouting).toBe(false);
  });

  it("child flags require parent enabled", () => {
    process.env.MAPABLE_ACCESS_QUESTS_ENABLED = "true";
    expect(openInfrastructureFlags.accessQuests).toBe(false);

    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    expect(openInfrastructureFlags.accessQuests).toBe(true);
  });

  it("flag matrix reflects env", () => {
    const matrix = getOpenInfrastructureFlagMatrix();
    expect(matrix.enabled).toBe(false);
    expect(Object.values(matrix).every((v) => v === false)).toBe(true);
  });
});
