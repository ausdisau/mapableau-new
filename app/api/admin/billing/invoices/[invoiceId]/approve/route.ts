import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getInvoiceById } from "@/lib/billing-core/invoice-service";
import { approveBillingInvoice } from "@/lib/billing-core/transparent-billing";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;
  const existing = await getInvoiceById(invoiceId);
  if (!existing) {
    return jsonError("Invoice not found", 404);
  }

  if (existing.adminApprovalStatus === "approved") {
    return jsonOk({ invoice: existing });
  }

  const invoice = await approveBillingInvoice(invoiceId, user.id);
  return jsonOk({ invoice });
}
