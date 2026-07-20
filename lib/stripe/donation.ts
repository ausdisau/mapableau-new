import { z } from "zod";

import { createStripePaymentCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeSdkAvailable, stripeConfig } from "@/lib/stripe/config";

export const donationConfig = {
  connectedAccountId: process.env.STRIPE_DONATION_CONNECTED_ACCOUNT_ID,
  defaultAmountCents: Number(process.env.STRIPE_DONATION_DEFAULT_AMOUNT_CENTS ?? "2500"),
  minAmountCents: Number(process.env.STRIPE_DONATION_MIN_AMOUNT_CENTS ?? "500"),
  maxAmountCents: Number(process.env.STRIPE_DONATION_MAX_AMOUNT_CENTS ?? "500000"),
  platformFeeBps: Number(process.env.STRIPE_DONATION_PLATFORM_FEE_BPS ?? "0"),
  productName:
    process.env.STRIPE_DONATION_PRODUCT_NAME ?? "Donate to Australian Disability Ltd",
};

export const donationCheckoutSchema = z.object({
  amountCents: z.number().int().positive().optional(),
});

export function isDonationCheckoutConfigured(): boolean {
  return isStripeSdkAvailable() && Boolean(donationConfig.connectedAccountId);
}

export function calculateDonationPlatformFeeCents(amountCents: number): number {
  return Math.round(amountCents * (donationConfig.platformFeeBps / 10_000));
}

export function normalizeDonationAmountCents(amountCents?: number): number | null {
  const value = amountCents ?? donationConfig.defaultAmountCents;
  if (value < donationConfig.minAmountCents || value > donationConfig.maxAmountCents) {
    return null;
  }
  return value;
}

export async function createDonationCheckoutSession(params: {
  amountCents?: number;
  cancelPath?: string;
  successPath?: string;
}) {
  if (!isDonationCheckoutConfigured()) {
    return { ok: false as const, configured: false as const };
  }

  const amountCents = normalizeDonationAmountCents(params.amountCents);
  if (amountCents === null) {
    return { ok: false as const, error: "Amount out of allowed range" };
  }

  const platformFeeCents = calculateDonationPlatformFeeCents(amountCents);
  const base = stripeConfig.appUrl.replace(/\/$/, "");
  const successPath = params.successPath ?? "/?donate=success";
  const cancelPath = params.cancelPath ?? "/?donate=cancelled";

  const metadata = {
    mapablePurpose: "donation",
    beneficiary: "australian_disability_ltd",
  };

  const session = await createStripePaymentCheckoutSession({
    amountCents,
    productName: donationConfig.productName,
    successUrl: `${base}${successPath}`,
    cancelUrl: `${base}${cancelPath}`,
    metadata,
    transferDestination: donationConfig.connectedAccountId!,
    applicationFeeAmount: platformFeeCents,
  });

  return {
    ok: true as const,
    checkoutUrl: session.url,
    sessionId: session.id,
    amountCents,
    platformFeeCents,
  };
}
