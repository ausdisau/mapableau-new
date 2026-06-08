import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { exportInvoice } from "@/lib/billing-core/export-service";
import { exportInvoiceSchema } from "@/lib/billing-core/schemas";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json();
  const parsed = exportInvoiceSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await exportInvoice(
    user.id,
    parsed.data.invoiceId,
    parsed.data.format
  );
  if (!result.ok) {
    if ("code" in result && result.code === "INVOICE_NOT_APPROVED") {
      return Response.json(
        { error: result.error, code: result.code },
        { status: 403 },
      );
    }
    return jsonError(result.error ?? "Export failed", 404);
  }
  return jsonOk(result);
}
