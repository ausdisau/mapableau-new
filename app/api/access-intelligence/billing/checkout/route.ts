import { z } from "zod";

import { resolveAccessIntelligenceUser } from "@/lib/access-intelligence/api-auth";
import { AI_PLAN_TO_BILLING_PLAN_CODE } from "@/lib/access-intelligence/entitlements";
import { priceIdForPlan } from "@/lib/billing-core/config";
import { createSubscriptionCheckout } from "@/lib/billing-core/subscription-service";

const bodySchema = z.object({
  plan: z.enum([
    "verify_starter",
    "verify_operations",
    "verify_portfolio",
    "learning_organisation",
    "enterprise",
  ]),
});

/**
 * Start Stripe Checkout for an Access Intelligence plan (test mode).
 * Requires matching STRIPE_AI_*_PRICE_ID — never invents prices.
 */
export async function POST(request: Request) {
  const user = await resolveAccessIntelligenceUser();
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const planCode = AI_PLAN_TO_BILLING_PLAN_CODE[parsed.data.plan];
  const priceId = priceIdForPlan(planCode);
  if (!priceId) {
    return Response.json(
      {
        error:
          "Stripe test price not configured for this Access Intelligence plan. Set the matching STRIPE_AI_*_PRICE_ID environment variable.",
        code: "PRICE_NOT_CONFIGURED",
        planCode,
      },
      { status: 400 },
    );
  }

  const result = await createSubscriptionCheckout(user.id, planCode);
  if (!result.ok) {
    return Response.json({ error: result.error, planCode }, { status: 400 });
  }
  return Response.json({
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
    planCode,
    mode: "test_or_live_per_stripe_key",
  });
}
