import { describe, expect, it } from "vitest";

import { buildRecoveryOptions } from "@/lib/continuity/recovery/option-builder";

function caseStub(overrides: Partial<any> = {}) {
  return {
    id: "case-1",
    organisationId: "org-1",
    participantId: "p-1",
    category: "transport",
    status: "planning",
    priority: "medium",
    title: "Care cancel may affect transport",
    summary: null,
    coordinatorId: null,
    linkedCaseId: null,
    goalsPreservedJson: null,
    contextJson: null,
    openedById: "u-1",
    openedAt: new Date(),
    closedById: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
}

describe("recovery option builder", () => {
  it("returns options in stable deterministic order", () => {
    const a = buildRecoveryOptions({ case: caseStub() });
    const b = buildRecoveryOptions({ case: caseStub() });
    expect(a.map((o) => o.deterministicKey)).toEqual(b.map((o) => o.deterministicKey));
  });

  it("always includes no_safe_option", () => {
    const opts = buildRecoveryOptions({ case: caseStub() });
    expect(opts.some((o) => o.kind === "no_safe_option")).toBe(true);
  });

  it("always includes do_nothing", () => {
    const opts = buildRecoveryOptions({ case: caseStub() });
    expect(opts.some((o) => o.kind === "do_nothing")).toBe(true);
  });

  it("marks substitute_worker ineligible outside care category", () => {
    const opts = buildRecoveryOptions({ case: caseStub({ category: "transport" }) });
    const sw = opts.find((o) => o.kind === "substitute_worker");
    expect(sw?.eligibility).toBe("ineligible");
  });

  it("marks substitute_worker requires_approval in care category", () => {
    const opts = buildRecoveryOptions({ case: caseStub({ category: "care" }) });
    const sw = opts.find((o) => o.kind === "substitute_worker");
    expect(sw?.eligibility).toBe("requires_approval");
  });

  it("blocks any option key present in participant prohibitions", () => {
    const opts = buildRecoveryOptions({
      case: caseStub({ category: "care" }),
      participantProhibitedActions: ["substitute_worker"],
    });
    const sw = opts.find((o) => o.kind === "substitute_worker");
    expect(sw?.eligibility).toBe("blocked_by_prohibition");
  });

  it("finance_recovery category never emits an approve option", () => {
    const opts = buildRecoveryOptions({ case: caseStub({ category: "finance_recovery" }) });
    for (const o of opts) {
      expect(o.kind).not.toBe("substitute_worker");
      expect(o.kind).not.toBe("substitute_transport");
    }
    // finance_recovery includes manual_coordination requiring approval.
    const mc = opts.find((o) => o.kind === "manual_coordination");
    expect(mc?.eligibility).toBe("requires_approval");
    expect(mc?.preservesGoal).toBe(false);
  });

  it("housing category always requires human coordination", () => {
    const opts = buildRecoveryOptions({ case: caseStub({ category: "housing" }) });
    const mc = opts.find((o) => o.kind === "manual_coordination");
    expect(mc).toBeDefined();
    expect(mc?.requiresApproval).toBe(true);
  });

  it("respects emergency policy — no emergency actions are surfaced", () => {
    const opts = buildRecoveryOptions({
      case: caseStub({ category: "care" }),
      emergencyPolicyRequiresHumanDispatch: true,
    });
    // No option key mentions emergency; the boundary lives in the executor,
    // but the builder never emits an emergency kind.
    for (const o of opts) {
      expect(o.kind).not.toMatch(/emergency/);
    }
  });

  it("standing_instruction_apply appears only when hasStandingInstructionForScope=true", () => {
    const off = buildRecoveryOptions({ case: caseStub({ category: "care" }) });
    expect(off.some((o) => o.kind === "standing_instruction_apply")).toBe(false);
    const on = buildRecoveryOptions({
      case: caseStub({ category: "care" }),
      hasStandingInstructionForScope: true,
    });
    expect(on.some((o) => o.kind === "standing_instruction_apply")).toBe(true);
  });
});
