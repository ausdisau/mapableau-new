import { getOptionalApiUser } from "@/lib/api/optional-session";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createDonationCheckout } from "@/lib/donations/checkout-service";
import { donationCheckoutSchema } from "@/lib/donations/schemas";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = donationCheckoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const user = await getOptionalApiUser();

  const result = await createDonationCheckout({
    input: parsed.data,
    userId: user?.id,
    userEmail: user?.email,
  });

  if (!result.ok) {
    return jsonError(result.error ?? "Checkout failed", result.configured === false ? 503 : 400);
  }

  return jsonOk({
    checkoutUrl: result.checkoutUrl,
    donationId: result.donationId,
    sessionId: result.sessionId,
  });
}
