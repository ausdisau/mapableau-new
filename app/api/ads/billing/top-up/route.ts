import { z } from "zod";

import {
  ADS_TOPUP_MIN_CENTS,
  ADS_TOPUP_PRESETS_CENTS,
} from "@/lib/ads/auction/config";
import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import { createAdsWalletTopUpCheckout } from "@/lib/ads/billing/stripe-topup";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

const bodySchema = z.object({
  advertiserId: z.string().min(1),
  amountCents: z
    .number()
    .int()
    .refine(
      (v) =>
        v >= ADS_TOPUP_MIN_CENTS &&
        (ADS_TOPUP_PRESETS_CENTS as readonly number[]).includes(v),
      { message: "amountCents must be an allowed preset ≥ A$100" },
    ),
});

/**
 * POST /api/ads/billing/top-up
 * Creates Stripe Checkout for prepaid Ads wallet. Does not credit wallet.
 */
export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) return apiUnauthorized();

  if (!adsFlagsConfig.isStripeTopupsEnabled()) {
    return jsonError("Ads Stripe top-ups are disabled", 403);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await requireAdvertiserAccess(user, parsed.data.advertiserId);
  } catch (err) {
    if (err instanceof OrganisationAccessError) {
      return apiForbidden(err.message);
    }
    throw err;
  }

  try {
    const { session, topUp, wallet } = await createAdsWalletTopUpCheckout({
      advertiserId: parsed.data.advertiserId,
      amountCents: parsed.data.amountCents,
      userId: user.id,
      userEmail: user.email,
    });

    return jsonOk({
      checkoutUrl: session.url,
      sessionId: session.id,
      topUpId: topUp.id,
      walletId: wallet.id,
      amountCents: topUp.amountCents,
      amountMicros: topUp.amountMicros.toString(),
      note: "Wallet is credited only after verified Stripe webhook — not on redirect.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Top-up failed";
    return jsonError(message, 400);
  }
}
