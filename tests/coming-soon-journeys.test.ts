import { describe, expect, it } from "vitest";
import { PUBLIC_PLANNED_JOURNEYS, type PublicRoadmapModule } from "@/lib/marketing/coming-soon-journeys";

const modules: PublicRoadmapModule[] = ["care","employment","foods","moves","kids","marketplace","peer","telehealth"];

describe("public planned module journey descriptions", () => {
  it("covers all eight coming-soon modules", () => {
    expect(Object.keys(PUBLIC_PLANNED_JOURNEYS).sort()).toEqual([...modules].sort());
  });

  it("describes concrete steps, a release gate and a failure recovery for each", () => {
    for (const module of modules) {
      const j = PUBLIC_PLANNED_JOURNEYS[module];
      expect(j.title.length).toBeGreaterThan(10);
      expect(j.outcome.length).toBeGreaterThan(20);
      expect(j.steps.length).toBeGreaterThanOrEqual(3);
      expect(j.steps.every((step) => step.trim().length > 10)).toBe(true);
      expect(j.releaseGate.length).toBeGreaterThan(20);
      expect(j.recovery.length).toBeGreaterThan(20);
    }
  });
});
