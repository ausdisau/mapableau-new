import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { requireShoppingEnabled } from "@/lib/shopping/guard";
import { createOrderCheckout } from "@/lib/shopping/order-service";
import { checkoutSchema } from "@/lib/shopping/schemas";

export async function POST(req: Request) {
  const disabled = requireShoppingEnabled();
  if (disabled) return disabled;

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createOrderCheckout(user.id, parsed.data);
  if (!result.ok) {
    if ("decision" in result && result.decision) {
      return jsonOk({ checkout: result.decision, orderId: result.orderId }, 200);
    }
    return jsonError(result.error ?? "Checkout failed", 400);
  }

  return jsonOk({
    orderId: result.orderId,
    invoiceId: result.invoiceId,
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
  });
}
