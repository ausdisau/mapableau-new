import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { MAPABLE_DONATION_URL } from "@/lib/brand/constants";
import {
  createDonationCheckoutSession,
  donationCheckoutSchema,
  isDonationCheckoutConfigured,
} from "@/lib/stripe/donation";

export async function POST(req: Request) {
  if (!isDonationCheckoutConfigured()) {
    return jsonOk({
      configured: false,
      fallbackUrl: MAPABLE_DONATION_URL,
    });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const parsed = donationCheckoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createDonationCheckoutSession(parsed.data);
  if (!result.ok) {
    if ("configured" in result && result.configured === false) {
      return jsonOk({
        configured: false,
        fallbackUrl: MAPABLE_DONATION_URL,
      });
    }
    return jsonError(result.error ?? "Donation checkout failed", 400);
  }

  if (!result.checkoutUrl) {
    return jsonError("Stripe did not return a checkout URL", 502);
  }

  return jsonOk({
    configured: true,
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
    amountCents: result.amountCents,
  });
}
