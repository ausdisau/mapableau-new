/**
 * Wave 11 — Life Event service.
 *
 * Life events are declared by the participant or an authorised human
 * (delegate / coordinator). AURA can only SUGGEST a life event, never
 * create one autonomously. Nothing in the system infers a life event
 * from operational history.
 */

import type {
  LifeEvent,
  LifeEventKind,
  LifeEventSource,
  LifeEventStatus,
  ContinuitySignal,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";
import { asJson } from "@/lib/prisma-json";

export interface DeclareLifeEventInput {
  participantId: string;
  organisationId?: string | null;
  kind: LifeEventKind;
  source: LifeEventSource;
  declaredById: string;
  title: string;
  narrative?: string;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  detailsJson?: Record<string, unknown>;
  aiSuggested?: boolean;
}

/**
 * Declaring a life event never marks it `active` on its own. It starts as
 * `draft`. The declarer or an authorised human confirms it separately.
 */
export async function declareLifeEvent(input: DeclareLifeEventInput): Promise<LifeEvent> {
  if (input.source === "aura_suggestion" && !input.aiSuggested) {
    throw new Error("LIFE_EVENT_AURA_MUST_SET_AI_SUGGESTED");
  }
  return prisma.lifeEvent.create({
    data: {
      participantId: input.participantId,
      organisationId: input.organisationId ?? null,
      kind: input.kind,
      source: input.source,
      status: "draft",
      declaredById: input.declaredById,
      title: input.title,
      narrative: input.narrative,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      detailsJson: asJson(input.detailsJson ?? undefined),
      aiSuggested: input.aiSuggested ?? false,
      autoCreated: false,
    },
  });
}

/**
 * Confirmation is a HUMAN act. Even if the event was AURA-suggested, an
 * authorised user must confirm it.
 */
export async function confirmLifeEvent(input: {
  lifeEventId: string;
  confirmedById: string;
  activate?: boolean;
}): Promise<{ event: LifeEvent; signal: ContinuitySignal }> {
  const ev = await prisma.lifeEvent.findUnique({ where: { id: input.lifeEventId } });
  if (!ev) throw new Error("LIFE_EVENT_NOT_FOUND");
  if (ev.status !== "draft") throw new Error(`LIFE_EVENT_ALREADY_${ev.status.toUpperCase()}`);

  const nextStatus: LifeEventStatus = input.activate ? "active" : "confirmed";
  const updated = await prisma.lifeEvent.update({
    where: { id: ev.id },
    data: {
      status: nextStatus,
      confirmedById: input.confirmedById,
      reviewedAt: new Date(),
    },
  });

  const signal = await recordContinuitySignal({
    kind: "life_event_declared",
    participantId: updated.participantId,
    organisationId: updated.organisationId,
    sourceKind: "life_event",
    sourceRef: updated.id,
    lifeEventId: updated.id,
    payload: { kind: updated.kind, source: updated.source },
    dedupeKey: `life-event-declared-${updated.id}`,
    observedAt: new Date(),
    confidence: "high",
    status: "validated",
  });

  return { event: updated, signal };
}

export async function cancelLifeEvent(input: { lifeEventId: string; cancelledById: string }): Promise<LifeEvent> {
  const ev = await prisma.lifeEvent.findUnique({ where: { id: input.lifeEventId } });
  if (!ev) throw new Error("LIFE_EVENT_NOT_FOUND");
  return prisma.lifeEvent.update({
    where: { id: ev.id },
    data: { status: "cancelled" },
  });
}

export async function listLifeEventsForParticipant(participantId: string, options: {
  status?: LifeEventStatus | LifeEventStatus[];
  limit?: number;
} = {}) {
  const take = Math.min(Math.max(options.limit ?? 50, 1), 200);
  return prisma.lifeEvent.findMany({
    where: {
      participantId,
      ...(options.status
        ? { status: Array.isArray(options.status) ? { in: options.status } : options.status }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
  });
}

/**
 * Wave 11 rule — NEVER auto-derive a life event from operational history.
 * This helper exists solely to be tested; any caller invoking it throws.
 */
export function assertNotAutoLifeEventFromHistory(source: LifeEventSource): void {
  if (source !== "participant_self" && source !== "delegate" && source !== "coordinator" && source !== "provider" && source !== "aura_suggestion") {
    throw new Error("LIFE_EVENT_AUTO_FROM_HISTORY_PROHIBITED");
  }
}
