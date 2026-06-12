import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireAbilityPayPermission } from "@/lib/abilitypay/api-helpers";
import { canViewInvoice } from "@/lib/abilitypay/policy";
import { createCheckoutForAbilityPayInvoice } from "@/lib/abilitypay/stripe-adapter-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: Request, context: RouteContext) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const denied = requireAbilityPayPermission(user, "abilitypay:invoice:approve");
  if (denied) return denied;

  const { id } = await context.params;
  if (!(await canViewInvoice(user, id))) {
    return jsonError("Invoice not found", 404);
  }

  const result = await createCheckoutForAbilityPayInvoice({
    abilityPayInvoiceId: id,
    actorUserId: user.id,
    actorRole: user.primaryRole,
  });

  if (!result.ok) {
    const status =
      result.code === "STRIPE_NOT_CONFIGURED" ? 503 : 400;
    return jsonError(result.error, status);
  }

  return jsonOk({
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
    billingInvoiceId: result.billingInvoiceId,
    paymentAttemptId: result.paymentAttemptId,
  });
}
