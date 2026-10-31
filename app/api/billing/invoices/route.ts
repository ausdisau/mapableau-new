import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isResponse } from "@/lib/billing/api-helpers";
import {
  createDraftInvoice,
  listAccessibleBillingInvoices,
} from "@/lib/billing/core/invoice-service";
import { createInvoiceSchema } from "@/lib/billing/core/schemas";
import { isUnsafeMarketplaceInvoice } from "@/packages/marketplace-inclusive/src/index";

export async function GET() {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const invoices = await listAccessibleBillingInvoices(user);
  return jsonOk({ invoices });
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (isResponse(user)) return user;
  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);
  // Legacy Marketplace cart submits client-provided prices, GST and funding codes.
  // Fail closed until dedicated server-side order/quote verification is implemented.
  if (isUnsafeMarketplaceInvoice(parsed.data))
    return jsonError("Marketplace invoice checkout is not available until launch gates pass.", 409);
  const invoice = await createDraftInvoice(user.id, parsed.data);
  return jsonOk({ invoice }, 201);
}
