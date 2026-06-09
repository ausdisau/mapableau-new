import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createMarketplaceCheckout } from "@/lib/partner-marketplace/marketplace-service";

const bodySchema = z.object({
  listingId: z.string().cuid(),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await createMarketplaceCheckout({
      userId: user.id,
      listingId: parsed.data.listingId,
    });
    if (!result.ok) return jsonError(result.error ?? "Checkout failed", 400);
    return jsonOk({
      checkoutUrl: result.checkoutUrl,
      invoiceId: result.invoiceId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return jsonError(message, 400);
  }
}
