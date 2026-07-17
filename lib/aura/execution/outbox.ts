import { randomUUID } from "crypto";

import { appendWitness } from "../witness";

export type AuraOutboxEvent = {
  id: string;
  missionId: string;
  proposalId: string;
  executionId: string;
  correlationId: string;
  causationId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retryState: "pending" | "delivered" | "failed";
  deliveredAt?: string;
};

const outbox = new Map<string, AuraOutboxEvent>();

export function resetOutboxStore(): void {
  outbox.clear();
}

export function enqueueOutboxEvent(input: {
  missionId: string;
  proposalId: string;
  executionId: string;
  correlationId: string;
  causationId: string;
  eventType: string;
  payload: Record<string, unknown>;
}): AuraOutboxEvent {
  const event: AuraOutboxEvent = {
    id: randomUUID(),
    missionId: input.missionId,
    proposalId: input.proposalId,
    executionId: input.executionId,
    correlationId: input.correlationId,
    causationId: input.causationId,
    eventType: input.eventType,
    payload: input.payload,
    createdAt: new Date().toISOString(),
    retryState: "pending",
  };
  outbox.set(event.id, event);
  appendWitness({
    missionId: input.missionId,
    type: "execution.outbox_enqueued",
    summary: `Outbox: ${input.eventType}`,
    correlationId: input.correlationId,
    payload: {
      outboxEventId: event.id,
      executionId: input.executionId,
      eventType: input.eventType,
    },
  });
  return event;
}

export function markOutboxDelivered(eventId: string): void {
  const e = outbox.get(eventId);
  if (!e) return;
  outbox.set(eventId, {
    ...e,
    retryState: "delivered",
    deliveredAt: new Date().toISOString(),
  });
}

export function listOutboxForExecution(executionId: string): AuraOutboxEvent[] {
  return [...outbox.values()].filter((e) => e.executionId === executionId);
}

export function listOutboxForMission(missionId: string): AuraOutboxEvent[] {
  return [...outbox.values()].filter((e) => e.missionId === missionId);
}
