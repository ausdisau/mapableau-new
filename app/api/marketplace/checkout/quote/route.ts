import { requireApiSession } from "@/lib/api/auth-handler";
import { isResponse, jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { marketplaceCheckoutSchema } from "@/lib/marketplace/checkout-schema";
import { quoteMarketplaceCheckout } from "@/lib/marketplace/checkout-service";

/**
 * POST /api/marketplace/checkout/quote
 * Server-side payable total (subtotal + GST + platform fee) without creating an order.
 */
export async function POST(req: Request) {
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

  const quote = quoteMarketplaceCheckout(parsed.data.items);
  if (!quote.ok) return jsonError(quote.error, quote.status);

  return jsonOk({
    lines: quote.lines.map((line) => ({
      productId: line.productId,
      description: line.description,
      quantity: line.quantity,
      unitAmountCents: line.unitAmountCents,
      lineTotalCents: line.quantity * line.unitAmountCents,
      gstApplicable: line.gstApplicable,
    })),
    totals: quote.totals,
    currency: quote.currency,
    disclosures: quote.disclosures,
  });
}
