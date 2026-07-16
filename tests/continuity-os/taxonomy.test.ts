import { describe, expect, it } from "vitest";

import {
  getLifeEventType,
  listLifeEventTypes,
  requireLifeEventType,
} from "@/lib/continuity-os/taxonomy/registry";

describe("Life Event Registry", () => {
  it("lists versioned types including start_job", () => {
    const types = listLifeEventTypes();
    expect(types.length).toBeGreaterThan(20);
    const startJob = types.find((t) => t.code === "start_job");
    expect(startJob?.version).toBe("1.0.0");
    expect(startJob?.category).toBe("EMPLOYMENT");
  });

  it("returns full definition with prohibited automated decisions", () => {
    const def = requireLifeEventType("start_job");
    expect(def.prohibitedAutomatedDecisions).toContain("assign_worker");
    expect(def.prohibitedAutomatedDecisions).toContain("book_transport");
    expect(def.dependencies.some((d) => d.code === "accessible_transport")).toBe(
      true
    );
  });

  it("rejects unsupported event codes", () => {
    expect(() => requireLifeEventType("not_a_real_event")).toThrow(
      /UNSUPPORTED_LIFE_EVENT_TYPE/
    );
    expect(getLifeEventType("start_job")).toBeTruthy();
  });

  it("keeps hospital_to_home clinical boundary warnings", () => {
    const def = requireLifeEventType("hospital_to_home");
    expect(def.requiredWarnings.some((w) => /clinician/i.test(w))).toBe(true);
  });
});
