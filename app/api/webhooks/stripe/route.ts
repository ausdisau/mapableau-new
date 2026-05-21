import { headers } from "next/headers";
import Stripe from "stripe";

import { billingCoreConfig, isBillingStripeConfigured } from "@/lib/billing-core/config";
import {
  handleStripeBillingEvent,
  markWebhookProcessed,
  storeWebhookEventIdempotent,
} from "@/lib/billing-core/webhook-handler";
import { getStripeClient } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isBillingStripeConfigured()) {
    return new Response(JSON.stringify({ received: false }), { status: 200 });
  }

  const rawBody = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig || !billingCoreConfig.stripeWebhookSecret) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      billingCoreConfig.stripeWebhookSecret
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const { duplicate, eventRowId } = await storeWebhookEventIdempotent(
    event.id,
    event.type,
    event as unknown as object
  );

  if (!duplicate) {
    try {
      await handleStripeBillingEvent(event);
    } catch (err) {
      console.error("billing webhook handler error", err);
    }
    await markWebhookProcessed(eventRowId);
  }

  return new Response(JSON.stringify({ received: true, duplicate }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
