import { describe, expect, it } from "vitest";

import { SYNTHETIC_CSI_CONFIG } from "@/lib/care-intelligence/config";
import { verifyKernelAudit } from "@/lib/care-intelligence/kernel/audit";
import {
  CSI_KERNEL_CAPABILITIES,
  validateCapabilityRegistry,
} from "@/lib/care-intelligence/kernel/capabilities";
import { evaluateCsiAgiKernel } from "@/lib/care-intelligence/kernel/evaluation";
import { runCsiAgiKernel } from "@/lib/care-intelligence/kernel/kernel";
import type { KernelCapability } from "@/lib/care-intelligence/kernel/types";
import { getScenario } from "@/lib/care-intelligence/scenarios";

const NOW = new Date("2026-07-13T00:00:00.000Z");

function scenario(id: string) {
  const found = getScenario(id);
  if (!found) throw new Error(`Missing scenario: ${id}`);
  return found;
}

describe("CSI-AGI bounded kernel", () => {
  it("registers only participant-scoped, side-effect-free capabilities", () => {
    expect(validateCapabilityRegistry(CSI_KERNEL_CAPABILITIES)).toBe(true);
    expect(
      CSI_KERNEL_CAPABILITIES.every(
        (capability) =>
          !capability.sideEffects &&
          !capability.externalNetwork &&
          !capability.persistentWrite &&
          capability.participantScoped,
      ),
    ).toBe(true);
  });

  it("rejects prohibited or effectful capabilities before boot", () => {
    const unsafe = {
      ...CSI_KERNEL_CAPABILITIES[0],
      id: "execute_booking",
    } satisfies KernelCapability;
    expect(() => validateCapabilityRegistry([unsafe])).toThrow(
      "PROHIBITED_KERNEL_CAPABILITY",
    );

    const effectful = {
      ...CSI_KERNEL_CAPABILITIES[0],
      id: "unsafe_side_effect",
      sideEffects: true,
    } as unknown as KernelCapability;
    expect(() => validateCapabilityRegistry([effectful])).toThrow(
      "UNSAFE_KERNEL_CAPABILITY",
    );
  });

  it("runs a complete bounded cognitive cycle", () => {
    const run = runCsiAgiKernel(
      scenario("worker-cancellation"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.phase).toBe("completed");
    expect(run.cyclesCompleted).toBe(1);
    expect(run.cyclesCompleted).toBeLessThanOrEqual(run.maxCycles);
    expect(run.goals.length).toBeGreaterThan(0);
    expect(run.beliefs.length).toBeGreaterThan(1);
    expect(run.coordination.specialistObservations).toHaveLength(5);
    expect(run.invariants.every((invariant) => invariant.passed)).toBe(true);
  });

  it("surfaces metacognitive uncertainty without increasing authority", () => {
    const run = runCsiAgiKernel(
      scenario("worker-cancellation"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.metacognition.specialistDisagreement).toBe(true);
    expect(run.metacognition.humanReviewRequired).toBe(true);
    expect(run.metacognition.unresolvedUncertainties.length).toBeGreaterThan(0);
    expect(run.metacognition.selfModificationAttempted).toBe(false);
    expect(run.boundaries.policySelfModificationAllowed).toBe(false);
  });

  it("creates bounded commitments rather than executable actions", () => {
    const run = runCsiAgiKernel(
      scenario("linked-cancellation"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.commitments.length).toBeGreaterThan(0);
    expect(run.commitments.length).toBeLessThanOrEqual(
      SYNTHETIC_CSI_CONFIG.maxPlans,
    );
    expect(
      run.commitments.every(
        (commitment) =>
          !commitment.executionAllowed &&
          commitment.state === "awaiting_participant_confirmation",
      ),
    ).toBe(true);
    expect(run.boundaries.executionAttempts).toBe(0);
  });

  it("halts the kernel when the participant presses stop", () => {
    const run = runCsiAgiKernel(
      scenario("participant-stop"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(run.phase).toBe("halted");
    expect(run.haltReason).toBe("PARTICIPANT_STOP");
    expect(run.commitments).toEqual([]);
    expect(run.coordination.worldStateSummary.memoryEventsRead).toBe(0);
    expect(
      run.invariants.find((item) => item.id === "participant_stop_dominates")
        ?.passed,
    ).toBe(true);
  });

  it("halts on inactive participant authority", () => {
    for (const id of ["revoked-mandate", "expired-mandate"]) {
      const run = runCsiAgiKernel(scenario(id), SYNTHETIC_CSI_CONFIG, {
        now: NOW,
      });
      expect(run.phase).toBe("halted");
      expect(run.haltReason).toBe("PARTICIPANT_AUTHORITY_INACTIVE");
      expect(run.commitments).toEqual([]);
    }
  });

  it("produces a deterministic, tamper-evident audit chain", () => {
    const first = runCsiAgiKernel(
      scenario("vehicle-cancellation"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    const second = runCsiAgiKernel(
      scenario("vehicle-cancellation"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    expect(first.audit).toEqual(second.audit);
    expect(first.auditVerification.valid).toBe(true);
    expect(first.audit.at(-1)?.kind).toBe("kernel_completed");

    const tampered = first.audit.map((event) => ({ ...event }));
    tampered[2].summary = "Tampered summary";
    expect(verifyKernelAudit(tampered).valid).toBe(false);
    expect(verifyKernelAudit(tampered).firstInvalidSequence).toBe(3);
  });

  it("keeps policy arbitration separate from specialist deliberation", () => {
    const run = runCsiAgiKernel(
      scenario("provider-prompt-injection"),
      SYNTHETIC_CSI_CONFIG,
      { now: NOW },
    );
    const specialistEvent = run.audit.find(
      (event) => event.kind === "specialists_consulted",
    );
    const policyEvent = run.audit.find(
      (event) => event.kind === "policy_arbitrated",
    );
    expect(specialistEvent?.sequence).toBeLessThan(policyEvent?.sequence ?? 0);
    expect(run.coordination.filteredCandidateIds).toContain("worker-injected");
    expect(JSON.stringify(run).toLowerCase()).not.toContain(
      "ignore previous instructions",
    );
  });

  it("passes kernel invariants across the full adversarial catalogue", () => {
    const evaluation = evaluateCsiAgiKernel(SYNTHETIC_CSI_CONFIG);
    expect(evaluation.totalScenarios).toBe(18);
    expect(evaluation.passedScenarios).toBe(18);
    expect(evaluation.invariantFailures).toBe(0);
    expect(evaluation.auditFailures).toBe(0);
    expect(evaluation.passed).toBe(true);
  });
});
