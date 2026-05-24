import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { runInvoiceClaimValidation } from "@/lib/ndis-pricing/claim-validation-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const user = await requireApiPermission("provider:ndia:claim");
  if (user instanceof Response) return user;

  const { invoiceId } = await params;

  try {
    const result = await runInvoiceClaimValidation(invoiceId, user.id);
    return jsonOk({
      ...result,
      submittedToNdia: false,
      message: "Pre-check only — no claim was submitted to the NDIA.",
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INVOICE_NOT_FOUND") {
      return jsonError("Invoice not found", 404);
    }
    throw e;
  }
}
