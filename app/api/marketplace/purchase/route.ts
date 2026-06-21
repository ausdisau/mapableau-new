import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createMarketplacePurchaseInvoice } from "@/lib/partner-marketplace/purchase-service";
import { z } from "zod";

const purchaseSchema = z.object({
  listingId: z.string().cuid(),
});

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("listingId is required", 400);
  }

  const result = await createMarketplacePurchaseInvoice({
    buyerUserId: user.id,
    listingId: parsed.data.listingId,
  });

  if (!result.ok) {
    return jsonError(result.error, 400);
  }

  return jsonOk({
    invoiceId: result.invoiceId,
    totalCents: result.totalCents,
    message: "Draft invoice created. Proceed to checkout via billing APIs.",
  });
}
