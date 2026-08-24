import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ALL_EVAL_LAB_SCENARIOS,
  EVAL_LAB_SCENARIOS,
  HARD_SAFETY_DIMENSIONS,
  QUALITY_METRIC_DIMENSIONS,
  REQUIRED_ADVERSARIAL_KINDS,
  SYNTHETIC_PERSONAS,
  listRequiredAdversarialCoverage,
  runEvalLabScenario,
  runModelEvalRubrics,
  runNerveCentreEvalLab,
  syntheticParticipantId,
} from "@/lib/ai/platform/eval-lab";
import { nerveCentreEvalLabConfig } from "@/lib/config/nerve-centre-eval-lab";

describe("Nerve Centre Eval Lab", () => {
  beforeEach(() => {
    delete process.env.MAPABLE_NERVE_CENTRE_EVAL_LAB_ENABLED;
    delete process.env.MAPABLE_NERVE_CENTRE_EVAL_LAB_MODEL_EVALS_ENABLED;
  });

  afterEach(() => {
    delete process.env.MAPABLE_NERVE_CENTRE_EVAL_LAB_ENABLED;
    delete process.env.MAPABLE_NERVE_CENTRE_EVAL_LAB_MODEL_EVALS_ENABLED;
  });

  it("keeps the lab flag fail-closed and forbids production writes", () => {
    expect(nerveCentreEvalLabConfig.enabled).toBe(false);
    expect(nerveCentreEvalLabConfig.productionWritesAllowed).toBe(false);
    expect(nerveCentreEvalLabConfig.realParticipantDataAllowed).toBe(false);
  });

  it("covers required scenario families and adversarial kinds", () => {
    expect(EVAL_LAB_SCENARIOS.length).toBeGreaterThanOrEqual(8);
    expect(SYNTHETIC_PERSONAS.length).toBeGreaterThanOrEqual(6);
    const kinds = new Set(
      ALL_EVAL_LAB_SCENARIOS.map((s) => s.adversarial).filter(Boolean),
    );
    for (const required of REQUIRED_ADVERSARIAL_KINDS) {
      expect(kinds.has(required)).toBe(true);
    }
    expect(listRequiredAdversarialCoverage()).toEqual([
      ...REQUIRED_ADVERSARIAL_KINDS,
    ]);
  });

  it("separates hard safety dimensions from quality metrics", () => {
    const overlap = HARD_SAFETY_DIMENSIONS.filter((d) =>
      (QUALITY_METRIC_DIMENSIONS as readonly string[]).includes(d),
    );
    expect(overlap).toEqual([]);
  });

  it("uses functional access requirements rather than behavioural stereotypes", () => {
    for (const persona of SYNTHETIC_PERSONAS) {
      expect(persona.accessRequirements.length).toBeGreaterThan(0);
      for (const req of persona.accessRequirements) {
        expect(req.functionalNeed.length).toBeGreaterThan(8);
        expect(req.functionalNeed.toLowerCase()).not.toMatch(
          /\balways\b|\bnever listens\b|\bnon-compliant\b/,
        );
      }
      expect(syntheticParticipantId(persona.id).startsWith("syn-")).toBe(true);
    }
  });

  it("runs the full lab with zero production writes and all hard invariants green", async () => {
    const { report, text } = await runNerveCentreEvalLab({
      includeLegacyEvalSuite: true,
    });
    expect(report.productionWrites).toBe(false);
    expect(report.usedRealParticipantData).toBe(false);
    expect(report.legacyEvalSuiteIncluded).toBe(true);
    expect(report.results.length).toBe(ALL_EVAL_LAB_SCENARIOS.length);
    expect(report.results.every((r) => r.passedHard)).toBe(true);
    expect(report.hardInvariantFailures).toEqual([]);
    expect(report.results.every((r) => r.estimatedCostUsd === 0)).toBe(true);
    expect(text).toContain("Hard safety dimensions");
    expect(text).toContain("Agency metrics");
  });

  it("blocks forged approval", async () => {
    const forged = ALL_EVAL_LAB_SCENARIOS.find(
      (s) => s.id === "adv-forged-approval",
    )!;
    const result = await runEvalLabScenario(forged);
    expect(result.passedHard).toBe(true);
    expect(
      result.assertions.find((a) => a.id === "forged-approval-blocked")?.pass,
    ).toBe(true);
  });

  it("keeps safeguarding conclusions human-only", async () => {
    const scenario = ALL_EVAL_LAB_SCENARIOS.find(
      (s) => s.id === "adv-safeguarding-conclusion",
    )!;
    const result = await runEvalLabScenario(scenario);
    expect(result.passedHard).toBe(true);
    expect(result.agency.human_only_path_remains_human_only.pass).toBe(true);
  });

  it("does not enable model evals by default (no live spend)", () => {
    const rubrics = runModelEvalRubrics({
      syntheticAnswer: "Unknown — missing evidence",
      evidenceIds: [],
      claimedCertainty: 0.99,
    });
    expect(rubrics.enabled).toBe(false);
    expect(rubrics.results).toEqual([]);
  });

  it("records soft model rubrics when explicitly enabled without blocking CI", () => {
    process.env.MAPABLE_NERVE_CENTRE_EVAL_LAB_ENABLED = "true";
    process.env.MAPABLE_NERVE_CENTRE_EVAL_LAB_MODEL_EVALS_ENABLED = "true";
    const rubrics = runModelEvalRubrics({
      syntheticAnswer: "Unknown — missing evidence",
      evidenceIds: ["syn-ev-1"],
      claimedCertainty: 0.4,
    });
    expect(rubrics.enabled).toBe(true);
    expect(rubrics.results.every((r) => r.blockedCi === false)).toBe(true);
  });
});
