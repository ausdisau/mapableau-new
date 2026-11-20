import type { BillingStripeWebhookProcessingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const CLAIM_TTL_MS = 5 * 60 * 1000;

export type WebhookStoreResult = {
  duplicate: boolean;
  eventRowId: string;
  processingStatus: BillingStripeWebhookProcessingStatus;
};

function isTerminalProcessed(
  processed: boolean,
  status: BillingStripeWebhookProcessingStatus,
): boolean {
  return processed || status === "processed";
}

function claimExpired(claimExpiresAt: Date | null | undefined, now: Date): boolean {
  return !claimExpiresAt || claimExpiresAt.getTime() <= now.getTime();
}

/**
 * Idempotent store + claim for billing Stripe webhook events.
 * Already-processed events return duplicate=true.
 * Failed/quarantined/expired-claim rows can be reclaimed for retry.
 */
export async function storeWebhookEventIdempotent(
  stripeEventId: string,
  type: string,
  payload: object,
): Promise<WebhookStoreResult> {
  const now = new Date();
  const existing = await prisma.billingStripeWebhookEvent.findUnique({
    where: { stripeEventId },
  });

  if (existing && isTerminalProcessed(existing.processed, existing.processingStatus)) {
    return {
      duplicate: true,
      eventRowId: existing.id,
      processingStatus: existing.processingStatus,
    };
  }

  if (
    existing?.processingStatus === "processing" &&
    !claimExpired(existing.claimExpiresAt, now)
  ) {
    return {
      duplicate: true,
      eventRowId: existing.id,
      processingStatus: existing.processingStatus,
    };
  }

  const claimExpiresAt = new Date(now.getTime() + CLAIM_TTL_MS);
  const row = await prisma.billingStripeWebhookEvent.upsert({
    where: { stripeEventId },
    create: {
      stripeEventId,
      type,
      payload,
      processed: false,
      processingStatus: "processing",
      attemptCount: 1,
      claimedAt: now,
      claimExpiresAt,
      lastError: null,
    },
    update: {
      type,
      payload,
      processed: false,
      processingStatus: "processing",
      attemptCount: { increment: 1 },
      claimedAt: now,
      claimExpiresAt,
      lastError: null,
    },
  });

  return {
    duplicate: false,
    eventRowId: row.id,
    processingStatus: row.processingStatus,
  };
}

export async function markWebhookProcessed(eventRowId: string) {
  await prisma.billingStripeWebhookEvent.update({
    where: { id: eventRowId },
    data: {
      processed: true,
      processedAt: new Date(),
      processingStatus: "processed",
      lastError: null,
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function markWebhookFailed(eventRowId: string, error: unknown) {
  const message =
    error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000);
  await prisma.billingStripeWebhookEvent.update({
    where: { id: eventRowId },
    data: {
      processed: false,
      processingStatus: "failed",
      lastError: message,
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function markWebhookQuarantined(eventRowId: string, error: unknown) {
  const message =
    error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000);
  await prisma.billingStripeWebhookEvent.update({
    where: { id: eventRowId },
    data: {
      processed: false,
      processingStatus: "quarantined",
      lastError: message,
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}
