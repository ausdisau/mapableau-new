import { jsonOk } from "@/lib/api/response";
import { handleBillingApiError, requireInvoiceSession } from "@/lib/billing/invoice-api-handler";
import { createInvoiceFromServiceLog } from "@/lib/billing/invoice-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ serviceLogId: string }> }
) {
  try {
    const user = await requireInvoiceSession();
    if (user instanceof Response) return user;
    const { serviceLogId } = await params;
    const invoice = await createInvoiceFromServiceLog(serviceLogId, user.id);
    return jsonOk({ invoice }, 201);
  } catch (e) {
    return handleBillingApiError(e);
  }
}
