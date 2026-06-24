import { donationCheckoutMetadata } from "@/lib/donations/metadata";
import type { DonationCheckoutInput } from "@/lib/donations/schemas";
import { areDonationsEnabled } from "@/lib/donations/constants";
import { prisma } from "@/lib/prisma";
import { createStripePaymentCheckoutSession } from "@/lib/stripe/checkout";
import { isStripeSdkAvailable, stripeConfig } from "@/lib/stripe/config";

export async function createDonationCheckout(params: {
  input: DonationCheckoutInput;
  userId?: string;
  userEmail?: string | null;
}) {
  if (!areDonationsEnabled() || !isStripeSdkAvailable()) {
    return {
      ok: false as const,
      error: "Donations are not available right now. Please try again later.",
      configured: false,
    };
  }

  const { input, userId, userEmail } = params;
  const donorEmail = input.donorEmail ?? userEmail ?? undefined;

  const donation = await prisma.donation.create({
    data: {
      amountCents: input.amountCents,
      currency: stripeConfig.defaultCurrency.toUpperCase(),
      donorName: input.donorName,
      message: input.message,
      donorEmail,
      userId,
    },
  });

  const metadata = donationCheckoutMetadata({
    donationId: donation.id,
    userId,
  });

  try {
    const session = await createStripePaymentCheckoutSession({
      amountCents: input.amountCents,
      currency: stripeConfig.defaultCurrency,
      productName: "MapAble donation",
      successUrl: `${stripeConfig.appUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${stripeConfig.appUrl}/donate?cancelled=1`,
      metadata,
      customerEmail: donorEmail,
    });

    await prisma.donation.update({
      where: { id: donation.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    if (!session.url) {
      return { ok: false as const, error: "Stripe did not return a checkout URL" };
    }

    return {
      ok: true as const,
      checkoutUrl: session.url,
      donationId: donation.id,
      sessionId: session.id,
    };
  } catch (err) {
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "failed" },
    });
    console.error("Donation checkout error", err);
    return { ok: false as const, error: "Could not start checkout. Please try again." };
  }
}
