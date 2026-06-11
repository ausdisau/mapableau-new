import type { DonationStatus } from "@prisma/client";
import type Stripe from "stripe";

import {
  donationIdFromMetadata,
  isDonationStripeMetadata,
} from "@/lib/donations/metadata";
import { prisma } from "@/lib/prisma";

function paymentIntentId(session: Stripe.Checkout.Session): string | undefined {
  const pi = session.payment_intent;
  if (!pi) return undefined;
  return typeof pi === "string" ? pi : pi.id;
}

async function updateDonationBySession(
  session: Stripe.Checkout.Session,
  status: DonationStatus,
  extra?: { paidAt?: Date }
) {
  const donationId = donationIdFromMetadata(session.metadata ?? undefined);
  const where = donationId
    ? { id: donationId }
    : session.id
      ? { stripeCheckoutSessionId: session.id }
      : null;

  if (!where) return;

  const existing = await prisma.donation.findFirst({ where });
  if (!existing) return;
  if (existing.status === "paid" && status !== "paid") return;

  await prisma.donation.update({
    where: { id: existing.id },
    data: {
      status,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: paymentIntentId(session) ?? existing.stripePaymentIntentId,
      donorEmail: session.customer_details?.email ?? existing.donorEmail,
      paidAt: extra?.paidAt ?? (status === "paid" ? new Date() : existing.paidAt),
    },
  });
}

export async function handleDonationStripeEvent(event: Stripe.Event): Promise<void> {
  if (!event.type.startsWith("checkout.session")) return;

  const session = event.data.object as Stripe.Checkout.Session;
  if (!isDonationStripeMetadata(session.metadata ?? undefined)) return;

  switch (event.type) {
    case "checkout.session.completed":
      await updateDonationBySession(session, "paid", { paidAt: new Date() });
      break;
    case "checkout.session.async_payment_failed":
      await updateDonationBySession(session, "failed");
      break;
    case "checkout.session.expired":
      await updateDonationBySession(session, "cancelled");
      break;
    default:
      break;
  }
}
