import {
  donationConfig,
  DONATION_PRODUCT_NAME,
} from "@/lib/donations/donation-config";
import { createStripePaymentCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeSdkAvailable, stripeConfig } from "@/lib/stripe/config";
import { donationCheckoutMetadata } from "@/lib/stripe/metadata";

export type DonationCheckoutResult =
  | { configured: true; url: string }
  | { configured: false; message: string; paypalUrl: string };

export function validateDonationAmountCents(amountCents: number): string | null {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return "Enter a valid donation amount.";
  }
  const minCents = donationConfig.minAmountAud * 100;
  const maxCents = donationConfig.maxAmountAud * 100;
  if (amountCents < minCents) {
    return `Minimum donation is $${donationConfig.minAmountAud} AUD.`;
  }
  if (amountCents > maxCents) {
    return `Maximum donation is $${donationConfig.maxAmountAud.toLocaleString("en-AU")} AUD.`;
  }
  return null;
}

export async function createDonationCheckoutSession(
  amountCents: number,
): Promise<DonationCheckoutResult> {
  const validationError = validateDonationAmountCents(amountCents);
  if (validationError) {
    throw new Error(validationError);
  }

  if (!isStripeSdkAvailable()) {
    return {
      configured: false,
      message:
        "Card donations are not configured yet. You can still donate via PayPal.",
      paypalUrl: donationConfig.paypalUrl,
    };
  }

  const metadata = donationCheckoutMetadata({ amountCents });
  const session = await createStripePaymentCheckoutSession({
    amountCents,
    currency: donationConfig.currency,
    productName: DONATION_PRODUCT_NAME,
    successUrl: `${stripeConfig.appUrl}${donationConfig.successPath}`,
    cancelUrl: `${stripeConfig.appUrl}${donationConfig.cancelPath}`,
    metadata,
  });

  if (!session.url) {
    throw new Error("Stripe checkout session did not return a URL.");
  }

  return { configured: true, url: session.url };
}
