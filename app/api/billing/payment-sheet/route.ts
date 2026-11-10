import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createPaymentSheetForInvoice } from "@/lib/billing/core/payment-sheet-service";
import { checkoutSchema } from "@/lib/billing/core/schemas";

/**
 * POST /api/billing/payment-sheet
 * Returns Stripe PaymentSheet credentials for a payable BillingInvoice.
 * Google Pay / Apple Pay / cards via automatic_payment_methods.
 */
export async function POST(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createPaymentSheetForInvoice(
    user.id,
    parsed.data.invoiceId
  );

  if (!result.ok) {
    if ("decision" in result && result.decision) {
      return jsonOk({ checkout: result.decision }, 200);
    }
    const status =
      "configured" in result && result.configured === false ? 503 : 400;
    return jsonError(result.error ?? "PaymentSheet failed", status);
  }

  return jsonOk({
    customerId: result.customerId,
    ephemeralKey: result.ephemeralKey,
    paymentIntentClientSecret: result.paymentIntentClientSecret,
    paymentIntentId: result.paymentIntentId,
    paymentId: result.paymentId,
  });
}
