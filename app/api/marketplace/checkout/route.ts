import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isMarketplaceSurfaceEnabled } from "@/lib/config/year-one-scope";
import { marketplaceCheckoutSchema } from "@/lib/marketplace/checkout-schema";
import { createMarketplaceCheckout } from "@/lib/marketplace/checkout-service";

/**
 * POST /api/marketplace/checkout
 * Server-priced marketplace cart → pending BillingInvoice → Stripe Checkout Session
 * (or export-only for plan-managed pathway).
 */
export async function POST(req: Request) {
  if (!isMarketplaceSurfaceEnabled()) {
    return jsonError(
      "MapAble Marketplace is deferred for Year-One (Core, Care, Transport, Jobs).",
      501,
    );
  }

  const user = await requireApiSession();
  if (isResponse(user)) return user;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = marketplaceCheckoutSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await createMarketplaceCheckout(user.id, parsed.data);
  if (!result.ok) {
    return jsonError(result.error, "status" in result ? result.status : 400);
  }

  if (result.mode === "export_only") {
    return jsonOk({
      mode: result.mode,
      invoiceId: result.invoiceId,
      invoicePath: result.invoicePath,
      totals: result.totals,
      decision: result.decision,
      disclosures: result.disclosures,
    });
  }

  return jsonOk({
    mode: result.mode,
    invoiceId: result.invoiceId,
    checkoutUrl: result.checkoutUrl,
    sessionId: result.sessionId,
    totals: result.totals,
    disclosures: result.disclosures,
  });
}
