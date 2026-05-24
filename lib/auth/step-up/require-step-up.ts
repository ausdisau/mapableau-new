import { prisma } from "@/lib/prisma";
import {
  STEP_UP_TTL_MS,
  requiresStepUp,
  type StepUpAction,
} from "@/lib/auth/step-up/step-up-policy";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function hasValidStepUp(userId: string): Promise<boolean> {
  const session = await prisma.stepUpSession.findFirst({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { completedAt: "desc" },
  });
  return Boolean(session);
}

export async function completeStepUp(userId: string, method: string) {
  const expiresAt = new Date(Date.now() + STEP_UP_TTL_MS);
  const session = await prisma.stepUpSession.create({
    data: {
      userId,
      completedAt: new Date(),
      expiresAt,
      method,
    },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "auth.step_up_completed",
    entityType: "StepUpSession",
    entityId: session.id,
    metadata: { method },
  });

  return session;
}

export async function assertStepUp(userId: string, action: StepUpAction) {
  if (!requiresStepUp(action)) return;

  const ok = await hasValidStepUp(userId);
  if (!ok) {
    await createAuditEvent({
      actorUserId: userId,
      action: "auth.step_up_required",
      entityType: "StepUpSession",
      metadata: { action },
    });
    throw new Error("STEP_UP_REQUIRED");
  }
}
