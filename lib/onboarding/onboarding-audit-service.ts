import type { RegistrationRole } from "@/types/registration";
import { prisma } from "@/lib/prisma";

export async function recordOnboardingEvent(params: {
  userId: string;
  eventType: string;
  role?: RegistrationRole | null;
  actorId?: string | null;
  payload?: Record<string, unknown>;
}) {
  await prisma.onboardingEvent.create({
    data: {
      userId: params.userId,
      role: params.role ?? null,
      eventType: params.eventType,
      actorId: params.actorId ?? params.userId,
      payloadJson: (params.payload ?? {}) as object,
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: params.actorId ?? params.userId,
      action: params.eventType,
      entityType: "onboarding",
      entityId: params.userId,
      participantId: params.role === "participant" ? params.userId : undefined,
      metadata: params.payload as object | undefined,
    },
  });
}
