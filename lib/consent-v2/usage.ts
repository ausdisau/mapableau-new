import type {
  ConsentPurpose,
  ConsentUseEvent,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface RecordConsentUseInput {
  directiveId: string;
  actorId?: string | null;
  actorLabel?: string | null;
  purpose: ConsentPurpose;
  action: string;
  outcome?: "allowed" | "denied" | "minimised" | "audited_only";
  minimisation?: Record<string, unknown> | null;
  correlationId?: string | null;
}

/**
 * Persist a `ConsentUseEvent` — a bare record that some data-use action was
 * taken under the given directive. Never carries payload contents.
 *
 * Callers of `discloseParticipantData` do NOT need to call this directly;
 * the disclosure gateway records the use event as part of its execution.
 */
export async function recordConsentUse(
  input: RecordConsentUseInput
): Promise<ConsentUseEvent> {
  return prisma.consentUseEvent.create({
    data: {
      directiveId: input.directiveId,
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel ?? null,
      purpose: input.purpose,
      action: input.action,
      outcome: input.outcome ?? "allowed",
      minimisation: asJson(input.minimisation ?? undefined),
      correlationId: input.correlationId ?? null,
    },
  });
}

export async function listConsentUsesForDirective(directiveId: string) {
  return prisma.consentUseEvent.findMany({
    where: { directiveId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function listConsentUsesForParticipant(
  participantId: string,
  limit = 200
) {
  return prisma.consentUseEvent.findMany({
    where: { directive: { subjectId: participantId } },
    orderBy: { createdAt: "desc" },
    include: {
      directive: {
        select: {
          id: true,
          purpose: true,
          recipientCategory: true,
          recipientOrganisationId: true,
        },
      },
    },
    take: Math.min(limit, 500),
  });
}
