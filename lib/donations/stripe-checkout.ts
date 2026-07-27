import type Stripe from "stripe";

import {
  DONATION_MAX_AMOUNT_CENTS,
  DONATION_METADATA_FLOW,
  DONATION_METADATA_PURPOSE,
  DONATION_MIN_AMOUNT_CENTS,
  isDonationStripeEnabled,
} from "@/lib/donations/config";
import { createStripePaymentCheckoutSession } from "@/lib/stripe/checkout";
import { stripeConfig } from "@/lib/stripe/config";

export type CreateDonationCheckoutInput = {
  amountCents: number;
  /** Optional display note; not shown as a separate line item. */
  customLabel?: string;
};

export type CreateDonationCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: string; status: number };

export function validateDonationAmountCents(amountCents: number): string | null {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return "Enter a whole-dollar amount in cents.";
  }
  if (amountCents < DONATION_MIN_AMOUNT_CENTS) {
    return "Minimum donation is $5 AUD.";
  }
  if (amountCents > DONATION_MAX_AMOUNT_CENTS) {
    return "Maximum donation is $50,000 AUD.";
  }
  return null;
}

export function buildDonationCheckoutMetadata(input: {
  amountCents: number;
  customLabel?: string;
}): Record<string, string> {
  const metadata: Record<string, string> = {
    purpose: DONATION_METADATA_PURPOSE,
    mapableFlow: DONATION_METADATA_FLOW,
    amountCents: String(input.amountCents),
    currency: stripeConfig.defaultCurrency,
    legalEntity: "Australian Disability Ltd",
  };
  if (input.customLabel?.trim()) {
    metadata.customLabel = input.customLabel.trim().slice(0, 120);
  }
  return metadata;
}

/**
 * Create a one-time Stripe Checkout Session for a donation to
 * Australian Disability Ltd. Card data never touches MapAble.
 */
export async function createDonationCheckoutSession(
  input: CreateDonationCheckoutInput,
): Promise<CreateDonationCheckoutResult> {
  if (!isDonationStripeEnabled()) {
    return {
      ok: false,
      error:
        "Card donations are temporarily unavailable. You can still give via PayPal.",
      status: 503,
    };
  }

  const amountError = validateDonationAmountCents(input.amountCents);
  if (amountError) {
    return { ok: false, error: amountError, status: 400 };
  }

  const origin = stripeConfig.appUrl.replace(/\/$/, "");
  const metadata = buildDonationCheckoutMetadata(input);

  let session: Stripe.Checkout.Session;
  try {
    session = await createStripePaymentCheckoutSession({
      amountCents: input.amountCents,
      currency: stripeConfig.defaultCurrency,
      productName: "Donation to Australian Disability Ltd",
      successUrl: `${origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/donate?checkout=cancelled`,
      metadata,
      paymentIntentData: {
        metadata,
        description: "Donation to Australian Disability Ltd (MapAble)",
      },
    });
  } catch (err) {
    console.error("[donations] Stripe Checkout session failed", err);
    return {
      ok: false,
      error: "Could not start checkout. Please try again shortly.",
      status: 502,
    };
  }

  if (!session.url) {
    return {
      ok: false,
      error: "Could not start checkout. Please try again shortly.",
      status: 502,
    };
  }

  return { ok: true, url: session.url, sessionId: session.id };
}
