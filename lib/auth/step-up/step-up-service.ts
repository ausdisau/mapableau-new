import { logAuthSecurityEvent } from "@/lib/auth/auth-audit-service";
import {
  isStepUpActionKey,
  stepUpTtlMs,
  type StepUpActionKey,
} from "@/lib/auth/step-up/step-up-policy";
import { prisma } from "@/lib/prisma";

export async function hasValidStepUp(
  userId: string,
  actionKey: string
): Promise<boolean> {
  if (!isStepUpActionKey(actionKey)) return false;
  const now = new Date();
  const challenge = await prisma.authStepUpChallenge.findFirst({
    where: {
      userId,
      actionKey,
      expiresAt: { gt: now },
    },
    orderBy: { verifiedAt: "desc" },
  });
  return !!challenge;
}

export async function recordStepUpVerification(
  userId: string,
  actionKey: StepUpActionKey,
  auth0UserId?: string
) {
  const expiresAt = new Date(Date.now() + stepUpTtlMs(actionKey));
  await prisma.authStepUpChallenge.create({
    data: { userId, actionKey, expiresAt },
  });
  await logAuthSecurityEvent({
    userId,
    auth0UserId,
    eventType: "step_up_verified",
    metadata: { actionKey },
  });
}

export async function requireStepUpOrThrow(
  userId: string,
  actionKey: string
): Promise<void> {
  const valid = await hasValidStepUp(userId, actionKey);
  if (!valid) {
    await logAuthSecurityEvent({
      userId,
      eventType: "step_up_required",
      metadata: { actionKey },
    });
    throw new Error(`STEP_UP_REQUIRED:${actionKey}`);
  }
}
