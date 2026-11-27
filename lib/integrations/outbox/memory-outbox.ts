import { integrationOutboxFlags } from "@/lib/integrations/outbox/flags";

export type OutboxDeliveryState =
  | "pending"
  | "running"
  | "delivered"
  | "retryable"
  | "needs_review"
  | "dead_letter"
  | "dry_run";

export type IntegrationOutboxRecord = {
  id: string;
  provider: "deputy" | "xero" | "stripe";
  aggregateType: string;
  aggregateId: string;
  dedupeKey: string;
  state: OutboxDeliveryState;
  attemptCount: number;
  lastErrorClass?: string;
  createdAt: string;
  updatedAt: string;
};

const memory: IntegrationOutboxRecord[] = [];

/**
 * In-process outbox scaffold (flags default off / dry-run).
 * Durable Prisma outbox tables land with Deputy/Xero adapter PRs.
 */
export function enqueueIntegrationOutbox(input: {
  provider: IntegrationOutboxRecord["provider"];
  aggregateType: string;
  aggregateId: string;
  dedupeKey: string;
}): IntegrationOutboxRecord {
  const existing = memory.find((r) => r.dedupeKey === input.dedupeKey);
  if (existing) return existing;

  const now = new Date().toISOString();
  const record: IntegrationOutboxRecord = {
    id: `outbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    provider: input.provider,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    dedupeKey: input.dedupeKey,
    state: !integrationOutboxFlags.outboxEnabled
      ? "needs_review"
      : integrationOutboxFlags.dryRun
        ? "dry_run"
        : "pending",
    attemptCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  memory.push(record);
  return record;
}

export function listIntegrationOutboxForTests(): IntegrationOutboxRecord[] {
  return [...memory];
}

export function resetIntegrationOutboxForTests(): void {
  memory.length = 0;
}
