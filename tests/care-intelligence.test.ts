import { describe, expect, it } from "vitest";

import {
  assertSyntheticBoundary,
  careIntelligenceConfigFromEnv,
  SYNTHETIC_CSI_CONFIG,
} from "@/lib/care-intelligence/config";
import { runCareIntelligence } from "@/lib/care-intelligence/engine";
import { evaluateCareIntelligence } from "@/lib/care-intelligence/evaluation";
import { getScenario, listScenarios } from "@/lib/care-intelligence/scenarios";

const NOW = new Date("2026-07-13T00:00:00.000Z");

function scenario(id: string) {
  const found = getScenario(id);
  if (!found) throw new Error(`Missing scenario: ${id}`);
  return found;
}

describe("MapAble Care & Support Intelligence research brain", () => {
  it("fails closed unless exact synthetic flags are present", () => {
    const config = careIntelligenceConfigFromEnv({
      MAPABLE_AUTONOMOUS_COORDINATION_ENABLED: "TRUE",
      MAPABLE_AUTONOMOUS_COORDINATION_SANDBOX: "true",
      MAPABLE_AUTONOMOUS_COORDINATION_SYNTHETIC_ONLY: "true",
    });
    expect(config.enabled).toBe(false);
    expect(() => assertSyntheticBoundary(config)).toThrow("CSI_DISABLED");
  });

  it("rejects execution, messaging, external models and persistent memory", () => {
    const unsafe = [
      ["realWorldExecutionEnabled", "REAL_WORLD_EXECUTION_PROHIBITED"],
      ["externalMessagingEnabled", "EXTERNAL_MESSAGING_PROHIBITED"],
      ["externalModelsEnabled", "EXTERNAL_MODELS_PROHIBITED"],
      ["persistentMemoryEnabled", "PERSISTENT_MEMORY_PROHIBITED"],
    ] as const;
    unsafe.forEach(([key, message]) =>
      expect(() =>
        assertSyntheticBoundary({ ...SYNTHETIC_CSI_CONFIG, [key]: true }),
      ).toThrow(message),
    );
  });

  it("monitors a stable journey without candidate or memory access", () => {
    const run = runCareIntelligence(
      scenario("stable-linked-journey"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.decision).toBe("monitor");
    expect(run.plans).toEqual([]);
    expect(run.actionIntents).toEqual([]);
    expect(run.worldStateSummary.memoryEventsRead).toBe(0);
    expect(run.evidence.every((item) => item.sourceType !== "candidate")).toBe(
      true,
    );
  });

  it("deliberates across specialists and surfaces a trade-off", () => {
    const run = runCareIntelligence(
      scenario("worker-cancellation"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.decision).toBe("propose");
    expect(run.specialistObservations).toHaveLength(5);
    expect(run.agentDisagreement.present).toBe(true);
    expect(run.plans.length).toBeGreaterThan(1);
    expect(run.plans[0].counterfactual.utility).toBeGreaterThanOrEqual(
      run.plans[1].counterfactual.utility,
    );
  });

  it("creates only non-executable, participant-confirmed intents", () => {
    const run = runCareIntelligence(
      scenario("linked-cancellation"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.plans.length).toBeGreaterThan(0);
    expect(run.actionIntents).toHaveLength(run.plans.length);
    expect(
      run.actionIntents.every(
        (intent) =>
          !intent.executionAllowed &&
          intent.externalTool === null &&
          intent.participantConfirmationRequired,
      ),
    ).toBe(true);
    expect(run.boundaries.realWorldActions).toBe(0);
  });

  it("keeps complete linked plans inside total mandate limits", () => {
    const input = scenario("linked-cancellation");
    const run = runCareIntelligence(input, SYNTHETIC_CSI_CONFIG, { now: NOW });
    expect(
      run.plans.every(
        (plan) =>
          plan.counterfactual.priceDeltaCents <=
            input.world.mandate.maxPriceDeltaCents &&
          plan.counterfactual.timeShiftMinutes <=
            input.world.mandate.maxTimeShiftMinutes,
      ),
    ).toBe(true);
  });

  it("escalates when individually eligible items fail a combined limit", () => {
    const run = runCareIntelligence(
      scenario("combined-price-limit"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.decision).toBe("escalate");
    expect(run.plans).toEqual([]);
    expect(run.policy.ruleIds).toContain("CSI-NO-COMPLETE-PLAN-01");
  });

  it("stops before candidate and memory access when authority stops", () => {
    for (const id of [
      "participant-stop",
      "revoked-mandate",
      "expired-mandate",
    ]) {
      const run = runCareIntelligence(scenario(id), SYNTHETIC_CSI_CONFIG, {
        now: NOW,
      });
      expect(run.decision).toBe("blocked");
      expect(run.worldStateSummary.memoryEventsRead).toBe(0);
      expect(
        run.evidence.every(
          (item) =>
            item.sourceType !== "candidate" && item.sourceType !== "memory",
        ),
      ).toBe(true);
    }
  });

  it("treats accessibility and worker screening as hard constraints", () => {
    const access = runCareIntelligence(
      scenario("no-accessible-vehicle"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    const screening = runCareIntelligence(
      scenario("expired-worker-screening"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(access.decision).toBe("escalate");
    expect(screening.decision).toBe("escalate");
    expect(access.plans).toEqual([]);
    expect(screening.plans).toEqual([]);
  });

  it("requires human review for high-criticality unfamiliar support", () => {
    const run = runCareIntelligence(
      scenario("high-criticality-unfamiliar-worker"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.decision).toBe("escalate");
    expect(run.policy.ruleIds).toContain("CSI-HIGH-CONSEQUENCE-CHANGE-01");
    expect(JSON.stringify(run).toLowerCase()).not.toContain("vulnerability");
  });

  it("removes instruction-like provider text before evidence creation", () => {
    const run = runCareIntelligence(
      scenario("provider-prompt-injection"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    const serialized = JSON.stringify(run).toLowerCase();
    expect(run.filteredCandidateIds).toContain("worker-injected");
    expect(
      run.plans.every((plan) => plan.worker?.id !== "worker-injected"),
    ).toBe(true);
    expect(serialized).not.toContain("ignore previous instructions");
  });

  it("refuses clinical and funding decisions and escalates emergencies", () => {
    const clinical = runCareIntelligence(
      scenario("prohibited-clinical-decision"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    const funding = runCareIntelligence(
      scenario("prohibited-funding-decision"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    const emergency = runCareIntelligence(
      scenario("emergency-handoff"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(clinical.decision).toBe("refuse");
    expect(funding.decision).toBe("refuse");
    expect(emergency.decision).toBe("escalate");
  });

  it("returns fresh scenario instances for isolated research runs", () => {
    const first = scenario("worker-cancellation");
    first.world.mandate.status = "revoked";
    expect(scenario("worker-cancellation").world.mandate.status).toBe("active");
  });

  it("passes the complete adversarial evaluation suite", () => {
    const evaluation = evaluateCareIntelligence(SYNTHETIC_CSI_CONFIG);
    expect(listScenarios()).toHaveLength(18);
    expect(evaluation.totalScenarios).toBe(18);
    expect(evaluation.passedScenarios).toBe(18);
    expect(evaluation.hardBoundaryViolations).toBe(0);
    expect(evaluation.evidenceIntegrityFailures).toBe(0);
    expect(evaluation.passed).toBe(true);
  });
});
