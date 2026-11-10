import type { IntegrationDelivery, Prisma } from "@prisma/client";

import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import {
  enqueueDeliveryInputSchema,
  type EnqueueDeliveryInput,
} from "@/lib/integrations/contracts/types";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 8;
const BASE_BACKOFF_MS = 30_000;

export async function enqueueIntegrationDelivery(
  input: EnqueueDeliveryInput,
): Promise<{ delivery: IntegrationDelivery; created: boolean }> {
  const parsed = enqueueDeliveryInputSchema.parse(input);

  const existing = await prisma.integrationDelivery.findUnique({
    where: { dedupeKey: parsed.dedupeKey },
  });
  if (existing) {
    return { delivery: existing, created: false };
  }

  const delivery = await prisma.integrationDelivery.create({
    data: {
      eventId: parsed.eventId,
      aggregateType: parsed.aggregateType,
      aggregateId: parsed.aggregateId,
      aggregateRevision: parsed.aggregateRevision,
      provider: parsed.provider,
      organisationId: parsed.organisationId,
      externalTenantId: parsed.externalTenantId,
      dedupeKey: parsed.dedupeKey,
      payloadRefJson: (parsed.payloadRef ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      state: "pending",
    },
  });

  return { delivery, created: true };
}

export type DeliveryHandler = (delivery: IntegrationDelivery) => Promise<{
  ok: boolean;
  errorClass?: string;
  errorMessage?: string;
  needsReview?: boolean;
}>;

/**
 * Process pending/retryable deliveries. No-ops when outbox flag is off.
 * When dry-run is true, marks delivered without calling the remote handler body
 * beyond a dry-run acknowledgement.
 */
export async function processPendingDeliveries(
  handler: DeliveryHandler,
  options: { limit?: number; now?: Date } = {},
): Promise<{ processed: number; delivered: number; failed: number }> {
  if (!integrationsFeatureFlags.outboxEnabled()) {
    return { processed: 0, delivered: 0, failed: 0 };
  }

  const now = options.now ?? new Date();
  const limit = options.limit ?? 25;
  const dryRun = integrationsFeatureFlags.dryRun();

  const batch = await prisma.integrationDelivery.findMany({
    where: {
      state: { in: ["pending", "retryable"] },
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      deadLetteredAt: null,
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let delivered = 0;
  let failed = 0;

  for (const item of batch) {
    await prisma.integrationDelivery.update({
      where: { id: item.id },
      data: { state: "running", attemptCount: { increment: 1 } },
    });

    try {
      const result = dryRun
        ? { ok: true as const }
        : await handler(item);

      if (result.ok) {
        await prisma.integrationDelivery.update({
          where: { id: item.id },
          data: {
            state: "delivered",
            deliveredAt: now,
            lastErrorClass: null,
            lastErrorMessage: dryRun ? "dry_run" : null,
            nextRetryAt: null,
          },
        });
        delivered += 1;
        continue;
      }

      await markDeliveryFailure(item, result, now);
      failed += 1;
    } catch (err) {
      await markDeliveryFailure(
        item,
        {
          ok: false,
          errorClass: "unexpected",
          errorMessage:
            err instanceof Error ? err.message.slice(0, 2000) : String(err),
        },
        now,
      );
      failed += 1;
    }
  }

  return { processed: batch.length, delivered, failed };
}

async function markDeliveryFailure(
  item: IntegrationDelivery,
  result: {
    ok: boolean;
    errorClass?: string;
    errorMessage?: string;
    needsReview?: boolean;
  },
  now: Date,
) {
  const attempts = item.attemptCount + 1;
  if (result.needsReview) {
    await prisma.integrationDelivery.update({
      where: { id: item.id },
      data: {
        state: "needs_review",
        lastErrorClass: result.errorClass ?? "needs_review",
        lastErrorMessage: result.errorMessage?.slice(0, 2000),
      },
    });
    return;
  }

  if (attempts >= MAX_ATTEMPTS) {
    await prisma.integrationDelivery.update({
      where: { id: item.id },
      data: {
        state: "dead_letter",
        deadLetteredAt: now,
        lastErrorClass: result.errorClass ?? "max_attempts",
        lastErrorMessage: result.errorMessage?.slice(0, 2000),
      },
    });
    return;
  }

  const backoff = BASE_BACKOFF_MS * 2 ** Math.min(attempts - 1, 6);
  await prisma.integrationDelivery.update({
    where: { id: item.id },
    data: {
      state: "retryable",
      nextRetryAt: new Date(now.getTime() + backoff),
      lastErrorClass: result.errorClass ?? "retryable",
      lastErrorMessage: result.errorMessage?.slice(0, 2000),
    },
  });
}

export async function getOutboxStatusSummary(organisationId?: string) {
  const where = organisationId ? { organisationId } : {};
  const groups = await prisma.integrationDelivery.groupBy({
    by: ["state", "provider"],
    where,
    _count: { _all: true },
  });
  return groups.map((g) => ({
    state: g.state,
    provider: g.provider,
    count: g._count._all,
  }));
}
