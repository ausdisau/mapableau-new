import { createHash, randomUUID } from "node:crypto";

import type { AdPlacementOrderStatus } from "@prisma/client";

import { createDoohSandboxAdapter } from "@/lib/ads/connectors/dooh-sandbox";
import { createMapAbleOwnedConnector } from "@/lib/ads/connectors/mapable-owned";
import { prisma } from "@/lib/prisma";

export class PlacementOrderError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 409,
  ) {
    super(message);
    this.name = "PlacementOrderError";
  }
}

export async function authoriseSpend(input: {
  quoteId: string;
  advertiserId: string;
  actorUserId: string;
  campaignId?: string | null;
  approvedAmountMinor: number;
}) {
  const quote = await prisma.adPlacementQuote.findUnique({
    where: { id: input.quoteId },
  });
  if (!quote || quote.advertiserId !== input.advertiserId) {
    throw new PlacementOrderError("Quote not found", "QUOTE_NOT_FOUND", 404);
  }
  if (quote.expiresAt.getTime() < Date.now()) {
    throw new PlacementOrderError("Quote expired", "QUOTE_EXPIRED");
  }
  if (input.approvedAmountMinor < Number(quote.totalMinor)) {
    throw new PlacementOrderError(
      "Approved amount below quoted total",
      "SPEND_BELOW_QUOTE",
    );
  }

  return prisma.adSpendAuthorisation.create({
    data: {
      campaignId: input.campaignId ?? quote.campaignId,
      quoteId: quote.id,
      advertiserId: input.advertiserId,
      actorUserId: input.actorUserId,
      approvedAmountMinor: BigInt(input.approvedAmountMinor),
      currency: quote.currency,
      quoteHash: quote.termsHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
}

export async function createPlacementOrder(input: {
  advertiserId: string;
  organisationId?: string | null;
  quoteId: string;
  spendAuthorisationId: string;
  campaignId?: string | null;
  idempotencyKey: string;
  creativeReviewApproved: boolean;
}) {
  if (!input.creativeReviewApproved) {
    throw new PlacementOrderError(
      "Human creative review required before order dispatch",
      "CREATIVE_REVIEW_REQUIRED",
      403,
    );
  }

  const existing = await prisma.adPlacementOrder.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    if (existing.quoteId !== input.quoteId) {
      throw new PlacementOrderError(
        "Idempotency key reused with different quote",
        "IDEMPOTENCY_CONFLICT",
      );
    }
    return existing;
  }

  const quote = await prisma.adPlacementQuote.findUnique({
    where: { id: input.quoteId },
  });
  if (!quote || quote.advertiserId !== input.advertiserId) {
    throw new PlacementOrderError("Quote not found", "QUOTE_NOT_FOUND", 404);
  }
  if (quote.expiresAt.getTime() < Date.now()) {
    throw new PlacementOrderError("Quote expired", "QUOTE_EXPIRED");
  }

  const auth = await prisma.adSpendAuthorisation.findUnique({
    where: { id: input.spendAuthorisationId },
  });
  if (
    !auth ||
    auth.advertiserId !== input.advertiserId ||
    auth.quoteId !== quote.id ||
    auth.revokedAt
  ) {
    throw new PlacementOrderError(
      "Spend authorisation invalid",
      "SPEND_AUTH_INVALID",
      403,
    );
  }
  if (auth.quoteHash !== quote.termsHash) {
    throw new PlacementOrderError(
      "Spend authorisation quote hash mismatch",
      "QUOTE_HASH_MISMATCH",
    );
  }
  if (auth.expiresAt.getTime() < Date.now()) {
    throw new PlacementOrderError(
      "Spend authorisation expired",
      "SPEND_AUTH_EXPIRED",
    );
  }

  const requestId = randomUUID();
  const requestHash = createHash("sha256")
    .update(
      JSON.stringify({
        quoteId: quote.id,
        spendAuthorisationId: auth.id,
        termsHash: quote.termsHash,
      }),
    )
    .digest("hex");

  const order = await prisma.adPlacementOrder.create({
    data: {
      campaignId: input.campaignId ?? quote.campaignId,
      advertiserId: input.advertiserId,
      organisationId: input.organisationId ?? quote.organisationId,
      quoteId: quote.id,
      spendAuthorisationId: auth.id,
      channel: quote.channel,
      providerId: quote.providerId,
      status: "submission_pending",
      requestId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      committedBudgetMinor: quote.totalMinor,
      currency: quote.currency,
    },
  });

  return dispatchOrder(order.id);
}

async function dispatchOrder(orderId: string) {
  const order = await prisma.adPlacementOrder.findUniqueOrThrow({
    where: { id: orderId },
    include: { quote: true },
  });

  if (order.freezeRetry) {
    throw new PlacementOrderError(
      "Order retry frozen pending reconciliation",
      "RETRY_FROZEN",
    );
  }

  let status: AdPlacementOrderStatus = "submission_pending";
  let externalOrderId: string | undefined;
  let providerStatus = "pending";

  if (order.channel === "dooh") {
    const adapter = createDoohSandboxAdapter();
    const result = await adapter.submitApprovedOrder({
      internalOrderId: order.id,
      quoteId: order.quoteId,
      termsHash: order.quote.termsHash,
      idempotencyKey: order.idempotencyKey,
    });
    if (result.state === "submission_unknown") {
      status = "unknown_external_state";
      providerStatus = "unknown";
    } else if (result.state === "accepted_by_partner") {
      status = "accepted";
      externalOrderId = result.externalOrderId;
      providerStatus = "accepted";
    } else {
      status = "failed";
      providerStatus = result.state;
    }
  } else {
    const result = await createMapAbleOwnedConnector().submit({
      internalOrderId: order.id,
      idempotencyKey: order.idempotencyKey,
      payload: { quoteId: order.quoteId },
    });
    if (result.status === "unknown") {
      status = "unknown_external_state";
      providerStatus = "unknown";
    } else if (result.status === "accepted" || result.status === "pending") {
      status = result.status === "accepted" ? "accepted" : "submission_pending";
      externalOrderId = result.externalId;
      providerStatus = result.status;
    } else {
      status = "failed";
      providerStatus = result.status;
    }
  }

  await prisma.adExternalSubmission.create({
    data: {
      orderId: order.id,
      providerId: order.providerId,
      requestRef: order.requestId,
      providerOrderId: externalOrderId,
      requestHash: order.requestHash,
      status: providerStatus,
      responseCode: status === "unknown_external_state" ? 504 : 202,
    },
  });

  return prisma.adPlacementOrder.update({
    where: { id: order.id },
    data: {
      status,
      externalOrderId: externalOrderId ?? null,
      providerStatus,
      freezeRetry: status === "unknown_external_state",
      lastReconciledAt: new Date(),
    },
  });
}

export async function getPlacementOrderForAdvertiser(
  orderId: string,
  advertiserId: string,
) {
  const order = await prisma.adPlacementOrder.findUnique({
    where: { id: orderId },
    include: {
      deliveryEvidence: true,
      disputes: true,
      submissions: true,
      quote: true,
    },
  });
  if (!order || order.advertiserId !== advertiserId) return null;
  return order;
}

export async function pausePlacementOrder(orderId: string, advertiserId: string) {
  const order = await getPlacementOrderForAdvertiser(orderId, advertiserId);
  if (!order) {
    throw new PlacementOrderError("Order not found", "ORDER_NOT_FOUND", 404);
  }
  if (order.channel === "dooh") {
    await createDoohSandboxAdapter().requestPause(order.id);
  } else {
    await createMapAbleOwnedConnector().pause(order.id);
  }
  return prisma.adPlacementOrder.update({
    where: { id: order.id },
    data: { status: "paused_pending", providerStatus: "pause_pending" },
  });
}

export async function reconcilePlacementOrder(
  orderId: string,
  advertiserId: string,
) {
  const order = await getPlacementOrderForAdvertiser(orderId, advertiserId);
  if (!order) {
    throw new PlacementOrderError("Order not found", "ORDER_NOT_FOUND", 404);
  }

  if (order.status === "unknown_external_state") {
    // Reconcile-before-retry: inspect provider reference; do not resubmit.
    const submission = order.submissions[0];
    if (!submission?.providerOrderId) {
      return {
        order,
        reconciliation: {
          status: "awaiting_provider",
          discrepancy: "unknown_external_state_without_provider_id",
          financialImpactMinor: 0,
        },
      };
    }
  }

  if (order.channel === "dooh") {
    const evidence = await createDoohSandboxAdapter().getDeliveryEvidence(
      order.id,
    );
    if (evidence.observedPlays != null) {
      await prisma.adDeliveryEvidence.create({
        data: {
          orderId: order.id,
          source: "dooh-sandbox",
          evidenceKind: "partner_reported_play",
          metric: "plays",
          value: evidence.observedPlays,
          unit: "plays",
          asOf: new Date(evidence.observedAt),
        },
      });
    }
    if (evidence.estimatedImpressions != null) {
      await prisma.adDeliveryEvidence.create({
        data: {
          orderId: order.id,
          source: "dooh-sandbox",
          evidenceKind: "modelled_impressions",
          metric: "estimated_impressions",
          value: evidence.estimatedImpressions,
          unit: "impressions",
          asOf: new Date(evidence.observedAt),
          licenceRef: "synthetic_fixture",
        },
      });
    }
  } else {
    const metrics = await createMapAbleOwnedConnector().fetchMetrics(order.id);
    const impressions = metrics.rows[0] as { value?: number } | undefined;
    await prisma.adDeliveryEvidence.create({
      data: {
        orderId: order.id,
        source: "mapable-owned",
        evidenceKind: "partner_reported_play",
        metric: "impressions",
        value: impressions?.value ?? 0,
        unit: "impressions",
        asOf: new Date(metrics.observedAt),
      },
    });
  }

  const updated = await prisma.adPlacementOrder.update({
    where: { id: order.id },
    data: {
      status:
        order.status === "unknown_external_state"
          ? "unknown_external_state"
          : "reconciled",
      lastReconciledAt: new Date(),
      freezeRetry: order.status === "unknown_external_state",
    },
    include: { deliveryEvidence: true, disputes: true },
  });

  return {
    order: updated,
    reconciliation: {
      status: updated.status,
      asOf: updated.lastReconciledAt?.toISOString() ?? null,
      evidenceCount: updated.deliveryEvidence.length,
      financialImpactMinor: 0,
    },
  };
}

export function serializeOrder(order: {
  id: string;
  status: AdPlacementOrderStatus;
  channel: string;
  providerId: string;
  externalOrderId: string | null;
  providerStatus: string | null;
  committedBudgetMinor: bigint;
  currency: string;
  freezeRetry: boolean;
  lastReconciledAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: order.id,
    status: order.status,
    channel: order.channel,
    providerId: order.providerId,
    externalOrderId: order.externalOrderId,
    providerStatus: order.providerStatus,
    committedBudget: {
      amountMinor: Number(order.committedBudgetMinor),
      currency: order.currency,
    },
    freezeRetry: order.freezeRetry,
    lastReconciledAt: order.lastReconciledAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
  };
}
