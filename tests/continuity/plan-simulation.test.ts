import { describe, expect, it, vi, beforeEach } from "vitest";

const state = {
  plan: {
    id: "plan-1",
    caseId: "case-1",
    status: "draft" as string,
    simulationJson: null as unknown,
    approvedById: null as string | null,
    approvedAt: null as Date | null,
    cancelledById: null as string | null,
    cancelledAt: null as Date | null,
  },
  steps: [
    { id: "s-1", stepIndex: 0, kind: "notify_participant", narrative: "Contact participant", detailsJson: null, compensationJson: null },
    { id: "s-2", stepIndex: 1, kind: "create_substitute_booking", narrative: "Substitute booking", detailsJson: null, compensationJson: null },
    { id: "s-3", stepIndex: 2, kind: "handoff_to_human", narrative: "Coordinator follow-up", detailsJson: null, compensationJson: null },
  ],
  writes: 0,
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    recoveryPlan: {
      create: vi.fn(),
      findUnique: vi.fn(async (args: any) => {
        if (args.where?.id !== state.plan.id) return null;
        return { ...state.plan, steps: state.steps, case: null };
      }),
      update: vi.fn(async (args: any) => {
        Object.assign(state.plan, args.data);
        return { ...state.plan };
      }),
    },
    recoveryPlanStep: {},
  },
}));

import {
  approveRecoveryPlan,
  cancelRecoveryPlan,
  canTransitionPlan,
  simulateRecoveryPlan,
} from "@/lib/continuity/recovery/plan-service";

beforeEach(() => {
  state.plan.status = "draft";
  state.plan.simulationJson = null;
  state.plan.approvedById = null;
  state.plan.cancelledById = null;
});

describe("recovery plan simulation & lifecycle", () => {
  it("draft -> simulated legal, records zero external writes", async () => {
    const result = await simulateRecoveryPlan("plan-1");
    expect(result.status).toBe("simulated");
    const snap = result.simulationJson as any;
    expect(snap.externalWritesPerformed).toBe(0);
    expect(snap.projected).toHaveLength(3);
  });

  it("simulated -> approved via approveRecoveryPlan", async () => {
    state.plan.status = "simulated";
    const r = await approveRecoveryPlan("plan-1", "u-1");
    expect(r.status).toBe("approved");
  });

  it("approve from draft is illegal", async () => {
    state.plan.status = "draft";
    await expect(approveRecoveryPlan("plan-1", "u-1")).rejects.toThrow(/CANNOT_APPROVE_FROM/);
  });

  it("cancel from draft is legal", async () => {
    state.plan.status = "draft";
    const r = await cancelRecoveryPlan("plan-1", "u-1");
    expect(r.status).toBe("cancelled");
  });

  it("cancel from completed is illegal", async () => {
    state.plan.status = "completed";
    await expect(cancelRecoveryPlan("plan-1", "u-1")).rejects.toThrow(/CANNOT_CANCEL_FROM/);
  });

  it("canTransitionPlan matrix respects execution_unknown as a real state", () => {
    expect(canTransitionPlan("executing", "execution_unknown")).toBe(true);
    expect(canTransitionPlan("execution_unknown", "compensated")).toBe(true);
    expect(canTransitionPlan("completed", "cancelled")).toBe(false);
  });
});
