import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { approveBillingInvoice } from "@/lib/billing-core/transparent-billing";
import { hasPermission } from "@/lib/auth/permissions";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "admin:billing:read")) {
    return jsonError("Forbidden", 403);
  }

  const { invoiceId } = await params;
  try {
    const invoice = await approveBillingInvoice(invoiceId, user.id);
    return jsonOk({ invoice });
  } catch {
    return jsonError("Invoice not found or could not be approved", 404);
  }
}
