import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { subscriptionCheckoutSchema } from "@/lib/billing-core/schemas";
import { createOrganisationSubscriptionCheckout } from "@/lib/billing-core/org-billing-service";
import { createSubscriptionCheckout } from "@/lib/billing-core/subscription-service";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = subscriptionCheckoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (parsed.data.organisationId) {
    const result = await createOrganisationSubscriptionCheckout(
      parsed.data.organisationId,
      user.id,
      parsed.data.planCode
    );
    if (!result.ok) {
      return jsonError(result.error ?? "Subscription checkout failed", 400);
    }
    return jsonOk({
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    });
  }

  const result = await createSubscriptionCheckout(
    user.id,
    parsed.data.planCode
  );
  if (!result.ok) return jsonError(result.error ?? "Subscription checkout failed", 400);
  return jsonOk({
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
  });
}
