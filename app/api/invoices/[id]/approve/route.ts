import { ZodError } from "zod";

import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { handleBillingApiError, requireInvoiceAccess } from "@/lib/billing/invoice-api-handler";
import { approveInvoice } from "@/lib/billing/invoice-service";
import { approveInvoiceSchema } from "@/types/billing";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireInvoiceAccess(id);
    if (access instanceof Response) return access;
    const body = approveInvoiceSchema.parse(await req.json().catch(() => ({})));
    const invoice = await approveInvoice(id, access.user.id, body.notes);
    return jsonOk({ invoice });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return handleBillingApiError(e);
  }
}
