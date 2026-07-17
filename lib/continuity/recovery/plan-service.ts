/**
 * Wave 11 — Recovery Plan Service.
 *
 * Draft a recovery plan for an approved option. Simulate the plan (zero
 * external writes) and record the simulation snapshot. Approve/cancel a
 * plan via a strict state machine.
 */

import type {
  RecoveryPlan,
  RecoveryPlanStatus,
  RecoveryPlanStep,
  RecoveryPlanStepKind,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

const PLAN_TRANSITIONS: Record<RecoveryPlanStatus, RecoveryPlanStatus[]> = {
  draft: ["simulated", "cancelled"],
  simulated: ["awaiting_participant", "awaiting_delegate", "awaiting_coordinator", "approved", "cancelled"],
  awaiting_participant: ["awaiting_delegate", "awaiting_coordinator", "approved", "cancelled"],
  awaiting_delegate: ["awaiting_coordinator", "approved", "cancelled"],
  awaiting_coordinator: ["approved", "cancelled"],
  approved: ["executing", "cancelled"],
  executing: ["completed", "failed", "execution_unknown", "cancelled"],
  execution_unknown: ["compensated", "failed", "cancelled"],
  completed: [],
  compensated: [],
  failed: ["compensated"],
  cancelled: [],
};

export function canTransitionPlan(from: RecoveryPlanStatus, to: RecoveryPlanStatus): boolean {
  return PLAN_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface DraftPlanStepInput {
  kind: RecoveryPlanStepKind;
  narrative: string;
  detailsJson?: Record<string, unknown>;
  compensationJson?: Record<string, unknown>;
}

export interface DraftPlanInput {
  caseId: string;
  selectedOptionId?: string;
  createdById: string;
  narrative?: string;
  steps: DraftPlanStepInput[];
}

export async function draftRecoveryPlan(input: DraftPlanInput): Promise<RecoveryPlan & { steps: RecoveryPlanStep[] }> {
  if (input.steps.length === 0) {
    throw new Error("RECOVERY_PLAN_MUST_HAVE_STEPS");
  }
  const plan = await prisma.recoveryPlan.create({
    data: {
      caseId: input.caseId,
      selectedOptionId: input.selectedOptionId,
      createdById: input.createdById,
      narrative: input.narrative,
      status: "draft",
      steps: {
        create: input.steps.map((s, i) => ({
          stepIndex: i,
          kind: s.kind,
          narrative: s.narrative,
          detailsJson: asJson(s.detailsJson ?? undefined),
          compensationJson: asJson(s.compensationJson ?? undefined),
        })),
      },
    },
    include: { steps: { orderBy: { stepIndex: "asc" } } },
  });
  return plan;
}

/**
 * Simulate the plan. This function MUST NOT perform any external write. It
 * only records what would happen if executed, into `simulationJson`.
 */
export async function simulateRecoveryPlan(planId: string): Promise<RecoveryPlan> {
  const plan = await prisma.recoveryPlan.findUnique({
    where: { id: planId },
    include: { steps: { orderBy: { stepIndex: "asc" } }, case: true },
  });
  if (!plan) throw new Error("RECOVERY_PLAN_NOT_FOUND");
  if (!canTransitionPlan(plan.status, "simulated")) {
    throw new Error(`RECOVERY_PLAN_CANNOT_SIMULATE_FROM_${plan.status}`);
  }
  const snapshot = {
    simulatedAt: new Date().toISOString(),
    externalWritesPerformed: 0,
    stepBudget: plan.steps.length,
    projected: plan.steps.map((s) => ({
      stepIndex: s.stepIndex,
      kind: s.kind,
      wouldMutateExternalSystem: [
        "create_substitute_booking",
        "reschedule_existing",
        "cancel_with_approval",
        "reserve_capacity",
      ].includes(s.kind),
      requiresApproval: [
        "cancel_with_approval",
        "create_substitute_booking",
        "reschedule_existing",
      ].includes(s.kind),
    })),
    warnings: plan.steps
      .filter((s) => s.kind === "handoff_to_human")
      .map(() => "This plan contains a hand-off to a human — that must actually happen."),
  };
  return prisma.recoveryPlan.update({
    where: { id: plan.id },
    data: { status: "simulated", simulationJson: snapshot },
  });
}

export async function approveRecoveryPlan(planId: string, approvedById: string): Promise<RecoveryPlan> {
  const plan = await prisma.recoveryPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("RECOVERY_PLAN_NOT_FOUND");
  if (!canTransitionPlan(plan.status, "approved")) {
    throw new Error(`RECOVERY_PLAN_CANNOT_APPROVE_FROM_${plan.status}`);
  }
  return prisma.recoveryPlan.update({
    where: { id: plan.id },
    data: { status: "approved", approvedById, approvedAt: new Date() },
  });
}

export async function cancelRecoveryPlan(planId: string, cancelledById: string): Promise<RecoveryPlan> {
  const plan = await prisma.recoveryPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error("RECOVERY_PLAN_NOT_FOUND");
  if (!canTransitionPlan(plan.status, "cancelled")) {
    throw new Error(`RECOVERY_PLAN_CANNOT_CANCEL_FROM_${plan.status}`);
  }
  return prisma.recoveryPlan.update({
    where: { id: plan.id },
    data: { status: "cancelled", cancelledById, cancelledAt: new Date() },
  });
}
