import { ZodError } from "zod";

import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { handleBillingApiError, requireInvoiceAccess } from "@/lib/billing/invoice-api-handler";
import { disputeInvoice } from "@/lib/billing/invoice-service";
import { disputeInvoiceSchema } from "@/types/billing";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireInvoiceAccess(id);
    if (access instanceof Response) return access;
    const body = disputeInvoiceSchema.parse(await req.json());
    const invoice = await disputeInvoice(id, access.user.id, body.reason);
    return jsonOk({ invoice });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return handleBillingApiError(e);
  }
}
