import { describe, expect, it } from "vitest";

import {
  buildAccessibleReport,
  loadHarbourStartingWorkScenario,
  runScenario,
} from "@/lib/replay-lab";

describe("Starting Work Under Compound Failure", () => {
  it("runs deterministically with the same seed", () => {
    const scenario = loadHarbourStartingWorkScenario();
    const a = runScenario({ scenario, seed: 42, runId: "sw_a" });
    const b = runScenario({ scenario, seed: 42, runId: "sw_a" });

    expect(a.events.map((e) => e.eventType)).toEqual(b.events.map((e) => e.eventType));
    expect(a.events.map((e) => e.virtualTimestamp)).toEqual(
      b.events.map((e) => e.virtualTimestamp),
    );
    expect(a.events.every((e) => e.synthetic === true)).toBe(true);
  });

  it("satisfies compound-failure assertions without a universal score", () => {
    const scenario = loadHarbourStartingWorkScenario();
    const result = runScenario({ scenario, seed: 42, runId: "sw_assert" });
    expect(result.scorecard.universalScore).toBeNull();

    const byId = Object.fromEntries(
      result.scorecard.assertionResults.map((r) => [r.assertionId, r.state]),
    );

    expect(byId.participant_authority_preserved).toMatch(/passed/);
    expect(byId.inaccessible_replacement_rejected).toBe("passed");
    expect(byId.unknown_hoist_not_confirmed).toBe("passed");
    expect(byId.communication_requirements_transferred).toBe("passed");
    expect(byId.recovery_options_presented).toBe("passed");
    expect(byId.no_automatic_assignment).toBe("passed");
    expect(byId.outcome_not_marked_achieved_without_confirmation).toMatch(
      /passed/,
    );
  });

  it("builds an accessible text-first report", () => {
    const scenario = loadHarbourStartingWorkScenario();
    const result = runScenario({ scenario, seed: 7, runId: "sw_report" });
    const report = buildAccessibleReport({
      title: scenario.scenario.title,
      seed: result.seed,
      scenarioId: result.scenarioId,
      runId: result.runId,
      events: result.events,
      actors: result.actors,
      scorecard: result.scorecard,
    });

    expect(report.events.length).toBeGreaterThan(5);
    expect(report.actors.some((a) => a.displayName === "Taylor")).toBe(true);
    expect(report.scorecard.universalScore).toBeNull();
    expect(report.watermark).toContain("not a production safety proof");
  });
});
