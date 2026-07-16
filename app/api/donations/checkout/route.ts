import { jsonError, jsonOk } from "@/lib/api/response";
import { createDonationCheckoutSession } from "@/lib/donations/donation-checkout-service";

export async function POST(req: Request) {
  let body: { amountCents?: unknown };
  try {
    body = (await req.json()) as { amountCents?: unknown };
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const amountCents = body.amountCents;
  if (typeof amountCents !== "number") {
    return jsonError("amountCents must be a number", 400);
  }

  try {
    const result = await createDonationCheckoutSession(amountCents);
    if (!result.configured) {
      return jsonOk(result);
    }
    return jsonOk({ configured: true, url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return jsonError(message, 400);
  }
}
