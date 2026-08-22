import type Stripe from "stripe";

import {
  handleAdsStripeEvent,
  isAdsWalletTopUpEvent,
} from "@/lib/ads/billing/stripe-webhook";
import {
  handleStripeBillingEvent,
  markWebhookProcessed,
  storeWebhookEventIdempotent,
} from "@/lib/billing/core/webhook-handler";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeSdkAvailable, stripeConfig } from "@/lib/stripe/config";
import {
  handleLegacyStripeEvent,
  markLegacyWebhookProcessed,
  storeLegacyWebhookEventIdempotent,
} from "@/lib/stripe/legacy-webhooks";
import { legacyInvoiceIdFromMetadata } from "@/lib/stripe/metadata";

export function constructStripeWebhookEvent(
  rawBody: string,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();
  if (!stripeConfig.webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  }
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    stripeConfig.webhookSecret
  );
}

function shouldHandleBillingCore(event: Stripe.Event): boolean {
  if (isAdsWalletTopUpEvent(event)) return false;

  const alwaysBilling = [
    "checkout.session.completed",
    "checkout.session.async_payment_failed",
    "checkout.session.async_payment_succeeded",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "charge.refunded",
    "charge.dispute.created",
    "account.updated",
    "account.external_account.updated",
    "transfer.created",
    "transfer.reversed",
    "payout.created",
    "payout.updated",
    "payout.paid",
    "payout.failed",
  ];
  if (alwaysBilling.includes(event.type)) return true;

  const obj = event.data.object as { metadata?: Stripe.Metadata | null };
  const meta = obj.metadata;
  if (!meta) {
    return false;
  }
  if (meta.invoiceId) return true;
  if (meta.mapableUserId && event.type.startsWith("customer.subscription")) {
    return true;
  }
  if (event.type === "account.updated" && meta.mapableUserId) return true;
  return false;
}

function shouldHandleLegacy(event: Stripe.Event): boolean {
  if (isAdsWalletTopUpEvent(event)) return false;

  const obj = event.data.object as { metadata?: Stripe.Metadata | null };
  const invoiceId = legacyInvoiceIdFromMetadata(obj.metadata);
  if (invoiceId) return true;
  if (event.type.startsWith("checkout.session")) {
    const session = obj as Stripe.Checkout.Session;
    return Boolean(session.id && !obj.metadata?.invoiceId);
  }
  return false;
}

function shouldHandleAds(event: Stripe.Event): boolean {
  return isAdsWalletTopUpEvent(event);
}

/**
 * Dispatch verified webhook to billing-core, Ads wallet, and/or legacy Invoice handlers.
 */
export async function dispatchStripeWebhook(event: Stripe.Event): Promise<{
  billing: { duplicate: boolean; processed: boolean };
  legacy: { duplicate: boolean; processed: boolean };
  ads: { duplicate: boolean; processed: boolean };
}> {
  const result = {
    billing: { duplicate: false, processed: false },
    legacy: { duplicate: false, processed: false },
    ads: { duplicate: false, processed: false },
  };

  if (shouldHandleAds(event)) {
    const stored = await storeWebhookEventIdempotent(
      `ads:${event.id}`,
      event.type,
      event as unknown as object
    );
    result.ads.duplicate = stored.duplicate;
    if (!stored.duplicate) {
      try {
        await handleAdsStripeEvent(event);
      } catch (err) {
        console.error("Stripe Ads webhook handler error", err);
      }
      await markWebhookProcessed(stored.eventRowId);
      result.ads.processed = true;
    }
  }

  if (shouldHandleBillingCore(event)) {
    const stored = await storeWebhookEventIdempotent(
      event.id,
      event.type,
      event as unknown as object
    );
    result.billing.duplicate = stored.duplicate;
    if (!stored.duplicate) {
      try {
        await handleStripeBillingEvent(event);
      } catch (err) {
        console.error("Stripe billing webhook handler error", err);
      }
      await markWebhookProcessed(stored.eventRowId);
      result.billing.processed = true;
    }
  }

  if (shouldHandleLegacy(event)) {
    const stored = await storeLegacyWebhookEventIdempotent(
      event.id,
      event.type,
      event as unknown as object
    );
    result.legacy.duplicate = stored.duplicate;
    if (!stored.duplicate) {
      try {
        await handleLegacyStripeEvent(event);
      } catch (err) {
        console.error("Stripe legacy webhook handler error", err);
      }
      await markLegacyWebhookProcessed(event.id);
      result.legacy.processed = true;
    }
  }

  return result;
}

export async function parseAndProcessWebhookRequest(
  rawBody: string,
  signature: string | null
): Promise<
  | {
      ok: true;
      billing: { duplicate: boolean };
      legacy: { duplicate: boolean };
      ads: { duplicate: boolean };
    }
  | { ok: false; status: number; message: string }
> {
  if (!isStripeSdkAvailable()) {
    return {
      ok: true,
      billing: { duplicate: false },
      legacy: { duplicate: false },
      ads: { duplicate: false },
    };
  }
  if (!signature) {
    return { ok: false, status: 400, message: "Missing stripe-signature header" };
  }

  let event: Stripe.Event;
  try {
    event = constructStripeWebhookEvent(rawBody, signature);
  } catch {
    return { ok: false, status: 400, message: "Invalid signature" };
  }

  const dispatched = await dispatchStripeWebhook(event);
  return {
    ok: true,
    billing: { duplicate: dispatched.billing.duplicate },
    legacy: { duplicate: dispatched.legacy.duplicate },
    ads: { duplicate: dispatched.ads.duplicate },
  };
}

/** @deprecated Use dispatchStripeWebhook */
export async function processStripeWebhookEvent(event: Stripe.Event) {
  const r = await dispatchStripeWebhook(event);
  return {
    duplicate: r.billing.duplicate || r.legacy.duplicate || r.ads.duplicate,
    handled: r.ads.processed
      ? "ads"
      : r.billing.processed
        ? "billing"
        : r.legacy.processed
          ? "legacy"
          : "none",
  };
}
