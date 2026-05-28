import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getInvoiceForUser } from "@/lib/billing-core/invoice-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { invoiceId } = await params;

  const invoice = await getInvoiceForUser(invoiceId, user.id);
  if (!invoice) return jsonError("Invoice not found", 404);

  return jsonOk({ invoice });
}
