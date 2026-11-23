import { describe, expect, it } from "vitest";

import {
  DEFAULT_DOORWAY_MINIMUM_MM,
  ST_IVES_DEMO_CLINICS,
  ST_IVES_FLOOR_PLAN,
  assistantSummaryForMinimum,
  buildComparisonRows,
  evaluateAgainstDoorMinimum,
  getClinicById,
  shouldPopulateStIvesDemo,
  summariseDemoMatches,
} from "@/lib/search/demo/st-ives-search-demo";
import { deepSearchAvailable } from "@/lib/search/mapable-search-ui";

describe("St Ives synthetic Search demo", () => {
  it("keeps Deep Search disabled", () => {
    expect(deepSearchAvailable).toBe(false);
  });

  it("evaluates doorway minimum against known widths", () => {
    expect(evaluateAgainstDoorMinimum(920, 900)).toBe("meets");
    expect(evaluateAgainstDoorMinimum(870, 900)).toBe("below");
    expect(evaluateAgainstDoorMinimum(null, 900)).toBe("unknown");
  });

  it("summarises one match and one alternative at 900 mm", () => {
    const summary = summariseDemoMatches(DEFAULT_DOORWAY_MINIMUM_MM);
    expect(summary.matchCount).toBe(1);
    expect(summary.alternativeCount).toBe(1);
    expect(summary.matches[0]?.id).toBe("demo-clinic-st-ives-allied-health");
    expect(summary.alternatives[0]?.id).toBe("demo-clinic-kuringgai-rehab");
  });

  it("marks both clinics below minimum at 930 mm", () => {
    const summary = summariseDemoMatches(930);
    expect(summary.matchCount).toBe(0);
    expect(summary.alternativeCount).toBe(2);
    expect(summary.summary).toContain("2 alternatives below minimum");
  });

  it("restores original counts at 900 mm after a higher threshold", () => {
    expect(summariseDemoMatches(930).matchCount).toBe(0);
    expect(summariseDemoMatches(900).matchCount).toBe(1);
  });

  it("exposes floor plan only for clinic 1", () => {
    expect(
      getClinicById("demo-clinic-st-ives-allied-health").hasFloorPlan,
    ).toBe(true);
    expect(getClinicById("demo-clinic-kuringgai-rehab").hasFloorPlan).toBe(
      false,
    );
    expect(ST_IVES_FLOOR_PLAN.clinicId).toBe(
      "demo-clinic-st-ives-allied-health",
    );
  });

  it("keeps clinic 2 kerb gradient unknown in comparison", () => {
    const bus = buildComparisonRows(900).find((row) => row.id === "bus");
    expect(bus?.clinic2Detail).toMatch(/gradient unknown/i);
  });

  it("does not invent accreditation language in assistant copy", () => {
    const copy = assistantSummaryForMinimum(900);
    expect(copy.toLowerCase()).not.toMatch(/gold|silver|registered|94\/100/);
  });

  it("populates demo only for explicit demo or matching conversation query", () => {
    expect(
      shouldPopulateStIvesDemo({
        demoParam: "st-ives",
        presentation: "web",
        query: "",
      }),
    ).toBe(true);
    expect(
      shouldPopulateStIvesDemo({
        demoParam: null,
        presentation: "conversation",
        query: "",
      }),
    ).toBe(false);
    expect(
      shouldPopulateStIvesDemo({
        demoParam: null,
        presentation: "conversation",
        query: "Find a physio near St Ives with a ceiling hoist",
      }),
    ).toBe(true);
  });

  it("uses stable clinic ids across the fixture set", () => {
    expect(ST_IVES_DEMO_CLINICS.map((c) => c.id)).toEqual([
      "demo-clinic-st-ives-allied-health",
      "demo-clinic-kuringgai-rehab",
    ]);
  });
});
