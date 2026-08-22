import {
  ADS_TOPUP_MIN_CENTS,
  ADS_WALLET_CURRENCY,
  MAPABLE_PURPOSE_ADS_WALLET_TOPUP,
} from "@/lib/ads/auction/config";
import { getOrCreateAdWallet } from "@/lib/ads/billing/wallet";
import { centsToMicros } from "@/lib/ads/money/micros";
import { prisma } from "@/lib/prisma";
import { createStripePaymentCheckoutSession } from "@/lib/stripe/checkout";
import { stripeConfig } from "@/lib/stripe/config";
import { ensureLegacyStripeCustomer } from "@/lib/stripe/customers";

export type CreateAdsTopUpCheckoutInput = {
  advertiserId: string;
  amountCents: number;
  userId: string;
  userEmail?: string | null;
  successPath?: string;
  cancelPath?: string;
};

/**
 * Create Stripe Checkout for prepaid Ads wallet top-up.
 * Credits happen only via verified webhook — never from success redirect.
 */
export async function createAdsWalletTopUpCheckout(
  input: CreateAdsTopUpCheckoutInput,
) {
  if (!Number.isInteger(input.amountCents) || input.amountCents < ADS_TOPUP_MIN_CENTS) {
    throw new Error(`Minimum top-up is A$${ADS_TOPUP_MIN_CENTS / 100}`);
  }

  const wallet = await getOrCreateAdWallet({
    advertiserId: input.advertiserId,
    currency: ADS_WALLET_CURRENCY,
  });

  if (wallet.status !== "ACTIVE") {
    throw new Error("Wallet is not active");
  }

  let stripeCustomerId = wallet.stripeCustomerId ?? undefined;
  if (!stripeCustomerId) {
    stripeCustomerId = await ensureLegacyStripeCustomer(
      input.userId,
      input.userEmail,
    );
    await prisma.adWallet.update({
      where: { id: wallet.id },
      data: { stripeCustomerId },
    });
  }

  const amountMicros = centsToMicros(input.amountCents);
  const topUp = await prisma.adWalletTopUp.create({
    data: {
      walletId: wallet.id,
      amountCents: input.amountCents,
      amountMicros,
      currency: ADS_WALLET_CURRENCY,
      status: "PENDING",
    },
  });

  const successPath =
    input.successPath ??
    `/provider/ads?checkout=success&topUpId=${topUp.id}`;
  const cancelPath =
    input.cancelPath ??
    `/provider/ads?checkout=cancelled&topUpId=${topUp.id}`;

  const metadata: Record<string, string> = {
    mapablePurpose: MAPABLE_PURPOSE_ADS_WALLET_TOPUP,
    advertiserId: input.advertiserId,
    walletId: wallet.id,
    topUpId: topUp.id,
  };

  const session = await createStripePaymentCheckoutSession({
    amountCents: input.amountCents,
    currency: ADS_WALLET_CURRENCY.toLowerCase(),
    customerId: stripeCustomerId,
    productName: "MapAble Ads wallet top-up",
    successUrl: `${stripeConfig.appUrl}${successPath}`,
    cancelUrl: `${stripeConfig.appUrl}${cancelPath}`,
    metadata,
    paymentIntentData: { metadata },
  });

  await prisma.adWalletTopUp.update({
    where: { id: topUp.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  return { topUp, session, wallet };
}
