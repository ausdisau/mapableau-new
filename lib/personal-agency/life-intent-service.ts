import type { LifeIntentStatus, Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { personalAgencyFlags } from "@/lib/config/personal-agency";
import { prisma } from "@/lib/prisma";

export class LifeIntentError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LifeIntentError";
  }
}

export function assertLifeIntentsEnabled(): void {
  if (!personalAgencyFlags.lifeIntentsEnabled) {
    throw new LifeIntentError("Life intents are not enabled.", 404);
  }
}

export async function listLifeIntentsForPrincipal(principalId: string) {
  assertLifeIntentsEnabled();
  return prisma.lifeIntent.findMany({
    where: { principalId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLifeIntentForPrincipal(id: string, principalId: string) {
  assertLifeIntentsEnabled();
  const intent = await prisma.lifeIntent.findFirst({
    where: { id, principalId },
  });
  if (!intent) {
    throw new LifeIntentError("Life intent not found.", 404);
  }
  return intent;
}

export type CreateLifeIntentInput = {
  principalId: string;
  originalExpression: string;
  status?: LifeIntentStatus;
  desiredOutcomes?: string[];
  notes?: string;
};

export async function createLifeIntent(input: CreateLifeIntentInput) {
  assertLifeIntentsEnabled();
  const expression = input.originalExpression.trim();
  if (!expression) {
    throw new LifeIntentError("Please describe what matters to you.", 400);
  }

  const intent = await prisma.lifeIntent.create({
    data: {
      principalId: input.principalId,
      originalExpression: expression,
      status: input.status ?? "EXPLORING",
      desiredOutcomes: input.desiredOutcomes ?? [],
      notes: input.notes?.trim() || null,
    },
  });

  await createAuditEvent({
    actorUserId: input.principalId,
    participantId: input.principalId,
    action: "PAI_LIFE_INTENT_CREATED",
    entityType: "LifeIntent",
    entityId: intent.id,
    metadata: {
      status: intent.status,
      expressionLength: expression.length,
    },
  });

  return intent;
}

export type UpdateLifeIntentInput = {
  id: string;
  principalId: string;
  status?: LifeIntentStatus;
  desiredOutcomes?: string[];
  notes?: string | null;
  /** Never update originalExpression from AI — only explicit participant edits. */
  originalExpression?: string;
};

export async function updateLifeIntent(input: UpdateLifeIntentInput) {
  assertLifeIntentsEnabled();
  await getLifeIntentForPrincipal(input.id, input.principalId);

  const data: Prisma.LifeIntentUpdateInput = {};
  if (input.status) data.status = input.status;
  if (input.desiredOutcomes) data.desiredOutcomes = input.desiredOutcomes;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.originalExpression !== undefined) {
    const trimmed = input.originalExpression.trim();
    if (!trimmed) {
      throw new LifeIntentError("Your words cannot be empty.", 400);
    }
    data.originalExpression = trimmed;
  }

  const intent = await prisma.lifeIntent.update({
    where: { id: input.id },
    data,
  });

  await createAuditEvent({
    actorUserId: input.principalId,
    participantId: input.principalId,
    action: "PAI_LIFE_INTENT_UPDATED",
    entityType: "LifeIntent",
    entityId: intent.id,
    metadata: { status: intent.status },
  });

  return intent;
}

export async function recordLifeIntentExplorationSaved(params: {
  principalId: string;
  intentId: string;
  label: string;
}) {
  await createAuditEvent({
    actorUserId: params.principalId,
    participantId: params.principalId,
    action: "PAI_LIFE_INTENT_EXPLORATION_SAVED",
    entityType: "LifeIntent",
    entityId: params.intentId,
    metadata: { label: params.label },
  });
}
