import { beforeEach, describe, expect, it } from "vitest";

import { AccessIntelligenceError } from "@/lib/access-intelligence/errors";
import {
  getLearningRepository,
  resetLearningRepositoryForTests,
} from "@/lib/access-intelligence/learning/repository";
import {
  evaluateDecisionAgainstRubric,
  evaluateTeachBackText,
  getHint,
  nextMasteryLevel,
} from "@/lib/access-intelligence/learning/rubric";
import { getScenarioById } from "@/lib/access-intelligence/learning/scenarios";
import type { PracticeSession } from "@/lib/access-intelligence/learning/schemas";
import {
  assertValidTransition,
  canRevealEvidence,
  LEARNING_STAGE_ORDER,
  nextStage,
} from "@/lib/access-intelligence/learning/state-machine";

describe("learning state machine", () => {
  it("defines the required transition order", () => {
    expect(LEARNING_STAGE_ORDER).toEqual([
      "orientation",
      "prediction",
      "investigation",
      "decision",
      "consequence",
      "revision",
      "teach_back",
      "reflection",
      "transfer",
      "complete",
    ]);
  });

  it("allows only sequential transitions", () => {
    expect(() => assertValidTransition("orientation", "prediction")).not.toThrow();
    expect(() => assertValidTransition("orientation", "decision")).toThrow(
      AccessIntelligenceError,
    );
    expect(nextStage("transfer")).toBe("complete");
  });
});

describe("learning repository & rubric", () => {
  beforeEach(() => {
    resetLearningRepositoryForTests();
  });

  it("requires prediction before evidence reveal when configured", () => {
    const repo = getLearningRepository();
    repo.saveLearningPreferences("user-1", {
      requirePredictionBeforeEvidence: true,
    });
    const session = repo.startScenario({
      userId: "user-1",
      scenarioId: "interview-level-three",
    });
    repo.advanceStage(session.id); // prediction
    expect(() =>
      repo.getScenarioEvidence("interview-level-three", session.id),
    ).toThrow(/Prediction is required/);
    repo.submitPrediction(session.id, "opt-lift-primary", 70);
    const evidence = repo.getScenarioEvidence("interview-level-three", session.id);
    expect(evidence.some((e) => e.status === "unknown")).toBe(true);
    expect(canRevealEvidence(repo.getSession(session.id))).toBe(true);
  });

  it("never upgrades unknown evidence into verified facts", () => {
    const repo = getLearningRepository();
    const evidence = repo.getScenarioEvidence("interview-level-three");
    const unknown = evidence.find((e) => e.id === "ev-stairs-unknown");
    expect(unknown?.status).toBe("unknown");
    expect(unknown?.summary.toLowerCase()).not.toMatch(/verified fact/);
  });

  it("produces deterministic rubric outcomes for the expected option", () => {
    const scenario = getScenarioById("interview-level-three")!;
    const decisionPoint = scenario.decisionPoints[0]!;
    const base: PracticeSession = {
      id: "s1",
      userId: "u1",
      scenarioId: scenario.id,
      mode: "practice",
      stage: "consequence",
      hintLevel: 0,
      predictionOptionId: "opt-lift-primary",
      decisionOptionId: "opt-lift-primary",
      revisionOptionId: null,
      confidencePrediction: 80,
      evidenceRevealed: true,
      eventTriggered: true,
      teachBackText:
        "The lift is verified and stairs remain unknown so we keep a contingency buffer.",
      reflections: [],
      transferComplete: false,
      responses: [],
      rubricEvaluation: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const good = evaluateDecisionAgainstRubric({
      scenario,
      session: base,
      decisionPoint,
    });
    const bad = evaluateDecisionAgainstRubric({
      scenario,
      session: { ...base, decisionOptionId: "opt-stairs-assume" },
      decisionPoint,
    });
    expect(good.passed).toBe(true);
    expect(bad.passed).toBe(false);
    expect(good.overallPercent).toBeGreaterThan(bad.overallPercent);
  });

  it("progresses hints prompt → point evidence → explanation", () => {
    expect(getHint(1).text).toMatch(/requirement/i);
    expect(getHint(2).text).toMatch(/evidence/i);
    expect(getHint(3).text).toMatch(/unknown/i);
    const repo = getLearningRepository();
    const session = repo.startScenario({
      userId: "u",
      scenarioId: "interview-level-three",
    });
    expect(repo.revealHint(session.id).level).toBe(1);
    expect(repo.revealHint(session.id).level).toBe(2);
    expect(repo.revealHint(session.id).level).toBe(3);
  });

  it("bounds teach-back evaluation and refuses professional competence awards", () => {
    const result = evaluateTeachBackText("too short", ["lift", "verified", "unknown"]);
    expect(result.passed).toBe(false);
    const ok = evaluateTeachBackText(
      "The verified lift is the primary route and unknown stairs stay unknown with a contingency.",
      ["lift", "verified", "unknown", "contingency"],
    );
    expect(ok.passed).toBe(true);
    const repo = getLearningRepository();
    const session = repo.startScenario({
      userId: "u",
      scenarioId: "respectful-reception",
    });
    // force stage
    let s = session;
    for (let i = 0; i < 6; i++) s = repo.advanceStage(s.id);
    expect(s.stage).toBe("teach_back");
    const evalResult = repo.evaluateTeachBack(
      s.id,
      "Consent and privacy matter; never infer capacity from a disability marker; use the side desk.",
    );
    expect(evalResult.feedback.join(" ")).toMatch(/does not certify professional competence/i);
  });

  it("updates mastery by concept rather than a global score", () => {
    const repo = getLearningRepository();
    repo.updateMastery("u", "evidence_reasoning", "introduced");
    const level = nextMasteryLevel(
      "introduced",
      {
        sessionId: "s",
        scenarioId: "x",
        dimensionScores: {
          requirement_recognition: 80,
          evidence_reasoning: 80,
          uncertainty_handling: 80,
          route_and_contingency: 80,
          consent_rights_privacy_communication: 80,
        },
        overallPercent: 80,
        feedback: [],
        passed: true,
        evaluatedAt: new Date().toISOString(),
      },
      false,
    );
    expect(level).toBe("developing");
    const records = repo.listMastery("u");
    expect(records.every((r) => r.conceptId)).toBe(true);
    expect(records.find((r) => (r as { score?: number }).score)).toBeUndefined();
  });

  it("supports scenario branching via expected vs alternate decision options", () => {
    const scenario = getScenarioById("lift-outage-appointment")!;
    expect(scenario.decisionPoints[0]!.options.length).toBeGreaterThanOrEqual(2);
    const repo = getLearningRepository();
    const session = repo.startScenario({
      userId: "u",
      scenarioId: scenario.id,
    });
    repo.advanceStage(session.id); // prediction
    repo.submitPrediction(session.id, "opt-ignore");
    repo.advanceStage(session.id); // investigation
    repo.getScenarioEvidence(scenario.id, session.id);
    repo.advanceStage(session.id); // decision
    const wrong = repo.submitAccessDecision(session.id, "opt-ignore");
    expect(wrong.evaluation.passed).toBe(false);
    const rightSession = repo.startScenario({
      userId: "u2",
      scenarioId: scenario.id,
    });
    repo.advanceStage(rightSession.id);
    repo.submitPrediction(rightSession.id, "opt-lift-b");
    repo.advanceStage(rightSession.id);
    repo.getScenarioEvidence(scenario.id, rightSession.id);
    repo.advanceStage(rightSession.id);
    const right = repo.submitAccessDecision(rightSession.id, "opt-lift-b");
    expect(right.evaluation.passed).toBe(true);
  });

  it("introduces dynamic incidents after decisions", () => {
    const repo = getLearningRepository();
    const session = repo.startScenario({
      userId: "u",
      scenarioId: "interview-level-three",
    });
    repo.advanceStage(session.id);
    repo.submitPrediction(session.id, "opt-lift-primary");
    repo.advanceStage(session.id);
    repo.getScenarioEvidence("interview-level-three", session.id);
    repo.advanceStage(session.id);
    repo.submitAccessDecision(session.id, "opt-lift-primary");
    const event = repo.simulateDynamicEvent(session.id);
    expect(event.triggered).toBe(true);
    expect(event.event?.id).toBe("dyn-lift-busy");
    expect(repo.getSession(session.id).eventTriggered).toBe(true);
  });

  it("lists six published scenarios with required didactic fields", () => {
    const repo = getLearningRepository();
    const published = repo.listScenarios().filter((s) => s.published);
    expect(published.length).toBeGreaterThanOrEqual(6);
    for (const s of published) {
      expect(s.humanGoal.length).toBeGreaterThan(10);
      expect(s.evidenceIds.length).toBeGreaterThan(0);
      expect(s.decisionPoints.length).toBeGreaterThan(0);
      expect(s.unknownHighlights.length).toBeGreaterThan(0);
      expect(s.teachBackPrompt.length).toBeGreaterThan(0);
      expect(s.reflectionPrompts.length).toBeGreaterThan(0);
      expect(s.transferTask.title.length).toBeGreaterThan(0);
      expect(s.author).toBeTruthy();
      expect(s.accessibilityReviewer).toBeTruthy();
      expect(s.livedExperienceReviewer).toBeTruthy();
      expect(s.version).toBeTruthy();
    }
  });

  it("blocks publish of generated content without required reviews", () => {
    const repo = getLearningRepository();
    const draft = repo.saveAuthorDraft({
      ...getScenarioById("interview-level-three")!,
      id: "draft-private",
      published: false,
      title: "Draft only",
    });
    const result = repo.requestPublish(draft.id);
    expect(result.allowed).toBe(false);
  });
});

describe("plan mode independence", () => {
  it("does not require lesson completion for ordinary planning exports", async () => {
    // Plan engines remain importable and callable without learning state
    const { calculatePersonalFit } = await import(
      "@/lib/access-intelligence/fit-engine"
    );
    const { evaluateAccessDecision } = await import(
      "@/lib/access-intelligence/decision-engine"
    );
    expect(typeof calculatePersonalFit).toBe("function");
    expect(typeof evaluateAccessDecision).toBe("function");
    resetLearningRepositoryForTests();
    const mastery = getLearningRepository().listMastery("anyone");
    expect(mastery.length).toBe(0);
  });
});
