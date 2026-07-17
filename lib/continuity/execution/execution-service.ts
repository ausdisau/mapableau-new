/**
 * Wave 11 — Continuity Recovery Execution.
 *
 * Wraps a single approved recovery plan in the shared Wave 10 idempotency +
 * state-machine + compensation patterns. Executions have a DETERMINISTIC
 * idempotency key derived from planId + input hash; retries converge on the
 * same execution row. `execution_unknown` is a valid terminal-ish state that
 * BLOCKS silent success claims.
 */

import { createHash } from "node:crypto";

import type {
  ContinuityRecoveryExecution,
  RecoveryPlanStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { canTransitionPlan } from "@/lib/continuity/recovery/plan-service";
import { asJson } from "@/lib/prisma-json";

export interface ExecutionInputs {
  planId: string;
  attempt?: number;
  inputHash?: string;
  nonce?: string;
}

export function computeContinuityExecutionKey(input: ExecutionInputs): string {
  const canonical = [
    input.planId,
    input.attempt ?? 1,
    input.inputHash ?? "",
    input.nonce ?? "",
  ].join("::");
  return createHash("sha256").update(canonical).digest("hex");
}

export interface StartExecutionInput extends ExecutionInputs {
  actorUserId: string;
  snapshot?: Record<string, unknown>;
}

export async function startRecoveryExecution(input: StartExecutionInput): Promise<ContinuityRecoveryExecution> {
  const plan = await prisma.recoveryPlan.findUnique({
    where: { id: input.planId },
  });
  if (!plan) throw new Error("RECOVERY_PLAN_NOT_FOUND");
  if (plan.status !== "approved" && plan.status !== "executing") {
    throw new Error(`RECOVERY_EXECUTION_REQUIRES_APPROVED_PLAN_GOT_${plan.status}`);
  }
  const idempotencyKey = computeContinuityExecutionKey(input);

  const existing = await prisma.continuityRecoveryExecution.findUnique({
    where: { idempotencyKey },
  });
  if (existing) return existing;

  if (canTransitionPlan(plan.status, "executing")) {
    await prisma.recoveryPlan.update({
      where: { id: plan.id },
      data: { status: "executing" },
    });
  }

  return prisma.continuityRecoveryExecution.create({
    data: {
      planId: plan.id,
      status: "executing",
      idempotencyKey,
      snapshotJson: asJson(input.snapshot ?? undefined),
    },
  });
}

export type FinishStatus = Extract<RecoveryPlanStatus, "completed" | "failed" | "execution_unknown" | "compensated" | "cancelled">;

export async function finishRecoveryExecution(input: {
  executionId: string;
  status: FinishStatus;
  errorNarrative?: string | null;
}): Promise<ContinuityRecoveryExecution> {
  const existing = await prisma.continuityRecoveryExecution.findUnique({ where: { id: input.executionId } });
  if (!existing) throw new Error("CONTINUITY_RECOVERY_EXECUTION_NOT_FOUND");

  const updated = await prisma.continuityRecoveryExecution.update({
    where: { id: existing.id },
    data: {
      status: input.status,
      finishedAt: new Date(),
      errorNarrative: input.errorNarrative ?? undefined,
    },
  });

  await prisma.recoveryPlan
    .findUnique({ where: { id: existing.planId } })
    .then(async (plan) => {
      if (!plan) return;
      if (canTransitionPlan(plan.status, input.status)) {
        await prisma.recoveryPlan.update({
          where: { id: plan.id },
          data: { status: input.status },
        });
      }
    });

  return updated;
}
