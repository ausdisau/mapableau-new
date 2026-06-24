import { z } from "zod";

import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { getInvoiceById } from "@/lib/billing-core/invoice-service";
import { adminDisputeBillingInvoice } from "@/lib/billing-core/transparent-billing";

const schema = z.object({
  reason: z.string().min(10).max(2000),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;
  const existing = await getInvoiceById(invoiceId);
  if (!existing) {
    return jsonError("Invoice not found", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const invoice = await adminDisputeBillingInvoice(
    invoiceId,
    user.id,
    parsed.data.reason,
  );
  return jsonOk({ invoice });
}
