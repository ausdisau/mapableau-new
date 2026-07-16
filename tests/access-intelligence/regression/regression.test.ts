import { describe, expect, it } from "vitest";

import {
  buildReleaseEvidencePack,
  detectCorridorWidthRegression,
  evaluateRedTeamCase,
  generateSyntheticBuilding,
  RED_TEAM_CORPUS,
  runRegressionAgainstBuilding,
  simulateAdapterContract,
} from "@/lib/access-intelligence/regression";

describe("System 10 regression lab", () => {
  it("generates synthetic buildings and detects café door blockers", () => {
    const cafe = generateSyntheticBuilding("cafe", "t1");
    const run = runRegressionAgainstBuilding(cafe);
    expect(run.decisions["synth-wheelchair"]).toBe("blocked");
  });

  it("detects corridor width regressions requiring review", () => {
    const findings = detectCorridorWidthRegression({
      previousWidthMm: 1000,
      nextWidthMm: 700,
      minRequiredMm: 850,
    });
    expect(findings[0]?.requiresReview).toBe(true);
    expect(findings[0]?.code).toBe("corridor_width_blocks_routes");
  });

  it("covers red-team corpus categories", () => {
    expect(RED_TEAM_CORPUS.length).toBeGreaterThanOrEqual(6);
    expect(evaluateRedTeamCase("diagnosis_inference").passed).toBe(true);
  });

  it("simulates adapter contract modes", () => {
    expect(simulateAdapterContract({ adapterKey: "bms", mode: "stale" }).freshness).toBe(
      "stale",
    );
    expect(simulateAdapterContract({ adapterKey: "gtfs", mode: "outage" }).ok).toBe(
      false,
    );
  });

  it("builds release evidence packs", () => {
    const pack = buildReleaseEvidencePack({
      versionLabel: "wave1",
      regressionFindings: 2,
      flagStates: { regressionSimulator: true },
    });
    expect(pack.contentHash).toHaveLength(24);
  });
});
