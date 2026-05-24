import { jsonOk } from "@/lib/api/response";
import { handleBillingApiError, requireInvoiceSession } from "@/lib/billing/invoice-api-handler";
import { listInvoicesForUser } from "@/lib/billing/invoice-service";

export async function GET() {
  try {
    const user = await requireInvoiceSession();
    if (user instanceof Response) return user;
    const invoices = await listInvoicesForUser(user);
    return jsonOk({ invoices });
  } catch (e) {
    return handleBillingApiError(e);
  }
}
