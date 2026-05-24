import { jsonOk } from "@/lib/api/response";
import { handleBillingApiError, requireInvoiceAccess } from "@/lib/billing/invoice-api-handler";
import { voidInvoiceBilling } from "@/lib/billing/invoice-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const access = await requireInvoiceAccess(id);
    if (access instanceof Response) return access;
    const invoice = await voidInvoiceBilling(id, access.user.id);
    return jsonOk({ invoice });
  } catch (e) {
    return handleBillingApiError(e);
  }
}
