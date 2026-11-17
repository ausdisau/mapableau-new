import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonOk } from "@/lib/api/response";
import { getOrCreateBillingAccount } from "@/lib/billing/core/account-service";
import { isBillingStripeConfigured } from "@/lib/billing/core/config";
import { paymentsMode } from "@/lib/payouts/config";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeSdkAvailable } from "@/lib/stripe/config";

/**
 * GET /api/billing/connect/status
 * Authenticated seller Connect account status for the current provider billing account.
 * Never returns bank account numbers — only Stripe Connect requirements summaries.
 */
export async function GET() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const stripeConfigured = isBillingStripeConfigured() && isStripeSdkAvailable();
  const payoutsEnabled = process.env.MAPABLE_PAYOUTS_ENABLED === "true";

  const account = await getOrCreateBillingAccount(user.id, "provider");
  // Prefer the payout recipient bound to this BillingAccount's Connect ID so
  // status/earnings cannot drift across multiple Stripe accounts.
  const recipient = account.stripeConnectedAccountId
    ? await prisma.payoutRecipient.findFirst({
        where: {
          OR: [
            { stripeAccountId: account.stripeConnectedAccountId },
            { userId: user.id, stripeAccountId: account.stripeConnectedAccountId },
          ],
        },
        orderBy: { updatedAt: "desc" },
      })
    : await prisma.payoutRecipient.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });

  const recentTransfers = recipient
    ? await prisma.payoutTransfer.findMany({
        where: { recipientId: recipient.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amountCents: true,
          currency: true,
          status: true,
          createdAt: true,
          stripeTransferId: true,
        },
      })
    : [];

  let stripeRequirements: {
    currentlyDue: string[];
    eventuallyDue: string[];
    disabledReason: string | null;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  } | null = null;

  if (stripeConfigured && account.stripeConnectedAccountId) {
    try {
      const stripe = getStripeClient();
      const connected = await stripe.accounts.retrieve(
        account.stripeConnectedAccountId,
      );
      stripeRequirements = {
        currentlyDue: connected.requirements?.currently_due ?? [],
        eventuallyDue: connected.requirements?.eventually_due ?? [],
        disabledReason: connected.requirements?.disabled_reason ?? null,
        chargesEnabled: Boolean(connected.charges_enabled),
        payoutsEnabled: Boolean(connected.payouts_enabled),
        detailsSubmitted: Boolean(connected.details_submitted),
      };
    } catch {
      stripeRequirements = null;
    }
  }

  return jsonOk({
    configured: stripeConfigured,
    paymentsMode: paymentsMode(),
    payoutsEnabled,
    connect: {
      billingAccountId: account.id,
      stripeConnectedAccountId: account.stripeConnectedAccountId,
      onboardingComplete: Boolean(
        stripeRequirements?.detailsSubmitted &&
          stripeRequirements.payoutsEnabled,
      ),
      requirements: stripeRequirements,
    },
    recipient: recipient
      ? {
          id: recipient.id,
          displayName: recipient.displayName,
          stripeOnboardingStatus: recipient.stripeOnboardingStatus,
          stripeAccountId: recipient.stripeAccountId,
          chargesEnabled: recipient.chargesEnabled,
          payoutsEnabled: recipient.payoutsEnabled,
          payoutSchedule: recipient.payoutSchedule,
        }
      : null,
    earnings: {
      /**
       * Platform→connected-account Transfers (not bank payouts).
       * Bank payouts are scheduled by Stripe on the connected account.
       */
      recentTransfers: recentTransfers.map((t) => ({
        id: t.id,
        amountCents: t.amountCents,
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        kind: "transfer_to_connected_account" as const,
      })),
      bankPayoutNote:
        "Bank payouts to the seller’s external account are scheduled by Stripe Connect (not browser-triggered).",
    },
  });
}
