import {
  MAPABLE_PURPOSE_ADS_WALLET_TOPUP,
} from "@/lib/ads/auction/config";
import {
  applyTopUpRefund,
  creditWalletTopUp,
  freezeWalletForDispute,
} from "@/lib/ads/billing/wallet";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

function metaPurpose(meta: Stripe.Metadata | null | undefined): string | undefined {
  return meta?.mapablePurpose ?? undefined;
}

export function isAdsWalletTopUpEvent(event: Stripe.Event): boolean {
  const obj = event.data.object as { metadata?: Stripe.Metadata | null };
  return metaPurpose(obj.metadata) === MAPABLE_PURPOSE_ADS_WALLET_TOPUP;
}

/**
 * Handle verified Stripe events for Ads prepaid top-ups.
 * Idempotent — duplicate events never double-credit.
 */
export async function handleAdsStripeEvent(
  event: Stripe.Event,
): Promise<{ handled: boolean; duplicate?: boolean }> {
  if (!isAdsWalletTopUpEvent(event)) {
    return { handled: false };
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return handleCheckoutSuccess(event);
    case "checkout.session.async_payment_failed":
      return handleCheckoutFailed(event);
    case "charge.refunded":
      return handleChargeRefunded(event);
    case "charge.dispute.created":
      return handleDispute(event);
    default:
      return { handled: false };
  }
}

async function handleCheckoutSuccess(
  event: Stripe.Event,
): Promise<{ handled: boolean; duplicate?: boolean }> {
  const session = event.data.object as Stripe.Checkout.Session;
  const topUpId = session.metadata?.topUpId;
  const walletId = session.metadata?.walletId;
  if (!topUpId || !walletId) {
    return { handled: true };
  }

  const topUp = await prisma.adWalletTopUp.findUnique({ where: { id: topUpId } });
  if (!topUp) return { handled: true };

  if (session.payment_intent && typeof session.payment_intent === "string") {
    await prisma.adWalletTopUp.update({
      where: { id: topUpId },
      data: {
        stripePaymentIntentId: session.payment_intent,
        stripeCheckoutSessionId: session.id,
      },
    });
  }

  const result = await creditWalletTopUp({
    walletId,
    amountMicros: topUp.amountMicros,
    topUpId,
    stripeEventId: event.id,
    idempotencyKey: `topup_credit:${topUpId}:${event.id}`,
  });

  return { handled: true, duplicate: result.duplicate };
}

async function handleCheckoutFailed(
  event: Stripe.Event,
): Promise<{ handled: boolean }> {
  const session = event.data.object as Stripe.Checkout.Session;
  const topUpId = session.metadata?.topUpId;
  if (!topUpId) return { handled: true };

  await prisma.adWalletTopUp.updateMany({
    where: { id: topUpId, status: "PENDING" },
    data: { status: "FAILED", stripeEventId: event.id },
  });
  return { handled: true };
}

async function handleChargeRefunded(
  event: Stripe.Event,
): Promise<{ handled: boolean; duplicate?: boolean }> {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  let topUp = paymentIntentId
    ? await prisma.adWalletTopUp.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      })
    : null;

  if (!topUp && charge.metadata?.topUpId) {
    topUp = await prisma.adWalletTopUp.findUnique({
      where: { id: charge.metadata.topUpId },
    });
  }

  if (!topUp) return { handled: true };

  const result = await applyTopUpRefund({
    walletId: topUp.walletId,
    topUpId: topUp.id,
    amountMicros: topUp.amountMicros,
    stripeEventId: event.id,
    idempotencyKey: `topup_refund:${topUp.id}:${event.id}`,
  });

  return { handled: true, duplicate: result.duplicate };
}

async function handleDispute(
  event: Stripe.Event,
): Promise<{ handled: boolean; duplicate?: boolean }> {
  const dispute = event.data.object as Stripe.Dispute;
  const chargeId =
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;

  // Prefer metadata on dispute/charge; fall back to payment intent lookup
  const metaTopUpId = dispute.metadata?.topUpId;
  let topUp = metaTopUpId
    ? await prisma.adWalletTopUp.findUnique({ where: { id: metaTopUpId } })
    : null;

  if (!topUp && chargeId) {
    // Best-effort: find by payment intent if we stored it via charge.payment_intent later
    topUp = await prisma.adWalletTopUp.findFirst({
      where: {
        OR: [
          { stripeEventId: chargeId },
          { stripePaymentIntentId: chargeId },
        ],
      },
    });
  }

  if (!topUp) return { handled: true };

  await prisma.adWalletTopUp.update({
    where: { id: topUp.id },
    data: { status: "DISPUTED" },
  });

  const result = await freezeWalletForDispute({
    walletId: topUp.walletId,
    stripeEventId: event.id,
    sourceId: dispute.id,
    idempotencyKey: `topup_dispute:${topUp.id}:${event.id}`,
  });

  return { handled: true, duplicate: result.duplicate };
}
