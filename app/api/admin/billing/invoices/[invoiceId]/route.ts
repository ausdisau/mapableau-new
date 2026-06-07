import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getInvoiceById } from "@/lib/billing-core/invoice-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    return jsonError("Invoice not found", 404);
  }

  return jsonOk({ invoice });
}
