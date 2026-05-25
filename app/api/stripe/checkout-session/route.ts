import { ZodError } from "zod";

import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { handleBillingApiError, requireInvoiceAccess } from "@/lib/billing/invoice-api-handler";
import { createCheckoutSessionForInvoice } from "@/lib/stripe/stripe-checkout-service";
import { checkoutSessionSchema } from "@/types/stripe";

export async function POST(req: Request) {
  try {
    const body = checkoutSessionSchema.parse(await req.json());
    const access = await requireInvoiceAccess(body.invoiceId);
    if (access instanceof Response) return access;
    if (access.invoice.participantId !== access.user.id) {
      return Response.json(
        { error: "Only the participant can pay this invoice online" },
        { status: 403 }
      );
    }
    const result = await createCheckoutSessionForInvoice({
      invoiceId: body.invoiceId,
      userId: access.user.id,
      amountCents: body.amountCents,
      successPath: body.successPath,
      cancelPath: body.cancelPath,
    });
    if (!result.ok) {
      return Response.json({ error: result.message }, { status: 503 });
    }
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return handleBillingApiError(e);
  }
}
