import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  storeWebhookEvent,
  markWebhookProcessed,
  handleStripeWebhookEvent,
} from "@/lib/billing/webhooks";
import { getStripe } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { isDuplicate, recordId } = await storeWebhookEvent(event);

  if (isDuplicate) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await handleStripeWebhookEvent(event);
    await markWebhookProcessed(recordId);
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    // Return 2xx to avoid endless retries for logic errors; event is stored for replay
    return NextResponse.json({ received: true, processed: false });
  }

  return NextResponse.json({ received: true, processed: true });
}
