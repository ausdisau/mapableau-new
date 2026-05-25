import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, jsonError } from "@/lib/api/response";
import { assertInvoiceAccess } from "@/lib/billing/invoice-access-service";
import { getXeroInvoiceSyncStatus } from "@/lib/xero/xero-invoice-sync-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { invoiceId } = await params;
  try {
    await assertInvoiceAccess(user, invoiceId);
  } catch {
    return jsonError("Forbidden", 403);
  }

  const status = await getXeroInvoiceSyncStatus(invoiceId);
  return jsonOk(status);
}
