import { describe, expect, it } from "vitest";

import { auraConfig } from "@/lib/aura/config";

describe("aura config invariants", () => {
  it("auto participant goals from chat is hardcoded off", () => {
    expect(auraConfig.autoParticipantGoalsFromChat).toBe(false);
  });

  it("auto memory from model output is hardcoded off", () => {
    expect(auraConfig.autoMemoryFromModelOutput).toBe(false);
  });

  it("simulationMandatory defaults to true", () => {
    expect(auraConfig.simulationMandatory).toBe(true);
  });

  it("plan step cap is positive", () => {
    expect(auraConfig.planStepCap).toBeGreaterThan(0);
  });

  it("plan depth cap is positive", () => {
    expect(auraConfig.planDepthCap).toBeGreaterThan(0);
  });
});
